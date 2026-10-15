[CmdletBinding(SupportsShouldProcess)]
param(
 [string]$DatabaseUrl=$env:DATABASE_URL,
 [string]$ApiBase='http://127.0.0.1:3000/api',
 [string]$GeoServerWfs='http://127.0.0.1:8080/geoserver/mgos/ows',
 [string]$EditorRole='mgos_editor',
 [string]$ReaderRole='mgos_geoserver',
 [ValidateSet('Military_Bases','Checkpoints','Operation_Sectors','Patrol_Routes','Threat_Areas','Supply_Routes','Military_Warehouses','Airports','Communication_Towers')][string]$Layer='Military_Bases',
 [guid]$FeatureId=[guid]::Empty,
 [ValidatePattern('^[a-z_][a-z0-9_]*$')][string]$Field='notes',
 [string]$ArcGisExpectedValue,
 [string]$MgosTestValue,
 [switch]$Apply,
 [string]$OutputPath
)
$ErrorActionPreference='Stop'
$map=@{Military_Bases='military_bases';Checkpoints='checkpoints';Operation_Sectors='operation_sectors';Patrol_Routes='patrol_routes';Threat_Areas='threat_areas';Supply_Routes='supply_routes';Military_Warehouses='military_warehouses';Airports='airports';Communication_Towers='communication_towers'}
$editable=@('notes','status','security_level','risk_level','name','base_name')
if($Field -notin $editable){throw "Field is not approved for verification: $Field"}
$psql=(Get-Command psql.exe -ErrorAction SilentlyContinue).Source
if(!$psql){$psql=(Get-ChildItem "$env:ProgramFiles\PostgreSQL" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue|Select-Object -First 1).FullName}
if(!$psql){throw 'psql.exe was not found.'}
if(!$DatabaseUrl){throw 'DATABASE_URL is required through the environment or parameter.'}
function Sql([string]$query){$value=& $psql -X -q -A -t -v ON_ERROR_STOP=1 $DatabaseUrl -c $query 2>&1;if($LASTEXITCODE -ne 0){throw (($value|Out-String)-replace $DatabaseUrl,'[REDACTED]')};return (($value|Out-String).Trim())}
function Check([string]$name,[bool]$passed,[string]$detail){[pscustomobject]@{name=$name;status=if($passed){'PASS'}else{'FAIL'};detail=$detail}}
$checks=[Collections.Generic.List[object]]::new()
$version=Sql "SELECT current_setting('server_version')||' / '||postgis_full_version();"
$roles=Sql "SELECT rolname||':'||rolsuper||':'||rolcreaterole FROM pg_roles WHERE rolname IN ('$EditorRole','$ReaderRole') ORDER BY rolname;"
$owner=Sql "SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname='mgos';"
$tableCount=[int](Sql "SELECT count(*) FROM information_schema.tables WHERE table_schema='mgos' AND table_name IN ('military_bases','checkpoints','operation_sectors','patrol_routes','threat_areas','supply_routes','military_warehouses','airports','communication_towers');")
$editorDml=Sql "SELECT CASE WHEN EXISTS(SELECT 1 FROM pg_roles WHERE rolname='$EditorRole') THEN has_schema_privilege('$EditorRole','mgos','USAGE') AND NOT has_schema_privilege('$EditorRole','mgos','CREATE') AND has_table_privilege('$EditorRole','mgos.military_bases','SELECT,INSERT,UPDATE,DELETE') ELSE false END;"
$readerSafe=Sql "SELECT CASE WHEN EXISTS(SELECT 1 FROM pg_roles WHERE rolname='$ReaderRole') THEN has_table_privilege('$ReaderRole','mgos.military_bases','SELECT') AND NOT has_table_privilege('$ReaderRole','mgos.military_bases','INSERT,UPDATE,DELETE') ELSE false END;"
$checks.Add((Check 'components' ($version -match 'PostGIS') $version));$checks.Add((Check 'roles-exist' (($roles -match $EditorRole)-and($roles -match $ReaderRole)) 'Operational roles detected without exposing credentials.'))
$checks.Add((Check 'schema-owner' (($owner-ne$EditorRole)-and($owner-ne$ReaderRole)) "Owner is $owner; operational roles are not owners."));$checks.Add((Check 'nine-layers' ($tableCount-eq 9) "$tableCount/9 operational tables found."));$checks.Add((Check 'editor-least-privilege' ($editorDml-eq't') 'Editor has DML and no schema CREATE.'));$checks.Add((Check 'reader-read-only' ($readerSafe-eq't') 'GeoServer role is SELECT-only.'))
$record=$null
if($FeatureId -ne [guid]::Empty){
 $table=$map[$Layer];$record=(Sql "SELECT jsonb_build_object('id',id,'value',$Field,'row_version',row_version,'updated_at',updated_at)::text FROM mgos.""$table"" WHERE id='$FeatureId';")|ConvertFrom-Json
 $checks.Add((Check 'record-found' ($null-ne$record) "Authorized record located in $Layer."))
 try{$api=Invoke-RestMethod "$ApiBase/features/$Layer/$FeatureId" -TimeoutSec 10;$checks.Add((Check 'api-read' ($api.id-eq$FeatureId.ToString()) 'MGOS API returns the shared record.'))}catch{$checks.Add((Check 'api-read' $false $_.Exception.Message))}
 try{$url=$GeoServerWfs+'?service=WFS&version=2.0.0&request=GetFeature&typeNames=mgos%3A'+$Layer+'&outputFormat=application%2Fjson&count=1';$wfs=Invoke-RestMethod $url -TimeoutSec 10;$checks.Add((Check 'wfs-read' ($null-ne$wfs.features) 'GeoServer WFS responded.'))}catch{$checks.Add((Check 'wfs-read' $false $_.Exception.Message))}
}
if($Apply){
 if($FeatureId -eq [guid]::Empty -or !$ArcGisExpectedValue -or !$MgosTestValue){throw '-Apply requires FeatureId, ArcGisExpectedValue, and MgosTestValue.'}
 if([string]$record.value-ne$ArcGisExpectedValue){throw 'Current value does not equal ArcGisExpectedValue; aborting without write.'}
 $original=[string]$record.value;$before=[long]$record.row_version
 try{
  $body=@{properties=@{$Field=$MgosTestValue};expectedVersion=$before}|ConvertTo-Json -Depth 4
  $updated=Invoke-RestMethod -Method Patch -Uri "$ApiBase/features/$Layer/$FeatureId" -ContentType 'application/json' -Body $body
  $checks.Add((Check 'mgos-write' ([long]$updated.properties.row_version-gt$before) 'MGOS update increased row_version.'))
  try{Invoke-RestMethod -Method Patch -Uri "$ApiBase/features/$Layer/$FeatureId" -ContentType 'application/json' -Body $body|Out-Null;$checks.Add((Check 'stale-conflict' $false 'Stale write unexpectedly succeeded.'))}catch{$checks.Add((Check 'stale-conflict' ($_.Exception.Response.StatusCode.value__-eq409) 'Stale expectedVersion was rejected.'))}
 } finally {
  $latest=Invoke-RestMethod "$ApiBase/features/$Layer/$FeatureId";$restore=@{properties=@{$Field=$original};expectedVersion=$latest.properties.row_version}|ConvertTo-Json -Depth 4;Invoke-RestMethod -Method Patch -Uri "$ApiBase/features/$Layer/$FeatureId" -ContentType 'application/json' -Body $restore|Out-Null;$checks.Add((Check 'restore' $true 'Original value restored.'))
 }
}
$result=[ordered]@{generatedAt=[datetime]::UtcNow.ToString('o');mode=if($Apply){'apply-and-restore'}else{'read-only'};layer=$Layer;featureId=if($FeatureId-ne[guid]::Empty){$FeatureId.ToString()}else{$null};status=if($checks.status-contains'FAIL'){'FAIL'}else{'PASS'};checks=$checks}
$json=$result|ConvertTo-Json -Depth 6
if($OutputPath){$json|Set-Content $OutputPath -Encoding utf8}
$json
if($result.status-ne'PASS'){exit 1}
