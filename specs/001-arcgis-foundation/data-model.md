# Data Model: ArcGIS Foundation

## قواعد عامة

- كل Feature Class يحمل `OBJECTID` و`GlobalID` تلقائيين.
- كل `*ID` من نوع Long هو معرف أعمال فريد وغير فارغ.
- حقول `*IDFK` من نوع GUID وتشير إلى `GlobalID` للأصل.
- كل البيانات المتجهة تستخدم `EPSG:32637` ومن دون Z أو M في النسخة الأولى.
- أسماء الحقول الفعلية إنجليزية، وAliases عربية كما في المصدر المرجعي.

## Feature Datasets

| Feature Dataset | Content |
|---|---|
| `Base_Data` | `Military_Bases`, `Checkpoints` |
| `Operations` | `Operation_Sectors`, `Patrol_Routes` |
| `Intelligence` | `Threat_Areas` |
| `Logistics` | `Supply_Routes`, `Military_Warehouses` |
| `Infrastructure` | `Airports`, `Communication_Towers` |
| `Analysis` | `Spatial_Analysis` Raster Dataset |

## Feature Classes

### Military_Bases — Point

`Base_ID Long`, `Base_Name Text(150)`, `Base_Type Short`, `Security_Level Short`, `Status Short`, `Soldiers_Count Long`, `Vehicles_Count Long`, `Commander Text(100)`, `Call_Sign Text(50)`, `Area_Size Double`, `Elevation Double`, `Power_Source Short`, `Communication_Status Short`, `Establish_Date Date`, `Last_Update Date`, `Notes Text(500)`.

### Checkpoints — Point

`Checkpoint_ID Long`, `Name Text(150)`, `Type Short`, `Personnel Short`, `Risk_Level Short`, `Status Short`, `Responsible_Unit Text(100)`, `Daily_Vehicles Long`, `Working_Hours Text(50)`, `Camera_Available Short`, `Created_Date Date`, `Notes Text(500)`.

### Operation_Sectors — Polygon

`Sector_ID Long`, `Name Text(150)`, `Sector_Type Short`, `Threat_Level Short`, `Terrain_Type Short`, `Troops_Count Long`, `Checkpoints_Count Long`, `Control_Level Short`, `Field_Commander Text(100)`, `Security_Percentage Double`, `Last_Operation Date`, `Notes Text(500)`.

### Patrol_Routes — Polyline

`Route_ID Long`, `Name Text(150)`, `Type Short`, `Risk_Level Short`, `Length_KM Double`, `Travel_Time Double`, `Personnel_Count Short`, `Vehicles_Count Short`, `Road_Status Short`, `Last_Patrol Date`, `Notes Text(500)`.

### Threat_Areas — Polygon

`Threat_ID Long`, `Name Text(150)`, `Threat_Type Short`, `Level Short`, `Enemy_Count Long`, `Weapon_Type Text(100)`, `Intel_Source Short`, `Last_Detected Date`, `Danger_Percentage Double`, `Night_Activity Short`, `Notes Text(1000)`.

### Supply_Routes — Polyline

`Route_ID Long`, `Name Text(150)`, `Status Short`, `Risk Short`, `Length_KM Double`, `Arrival_Time Double`, `Convoys_Count Long`, `Accessibility Short`, `Last_Supply Date`, `Notes Text(500)`.

### Military_Warehouses — Point

`Warehouse_ID Long`, `Name Text(150)`, `Type Short`, `Capacity Double`, `Protection_Level Short`, `Fill_Percentage Double`, `Temperature Double`, `Electricity Short`, `Last_Inventory Date`, `Notes Text(500)`.

### Airports — Point

`Airport_ID Long`, `Name Text(150)`, `Type Short`, `Runways Short`, `Runway_Length Double`, `Aircraft_Capacity Long`, `Security_Level Short`, `Airport_Status Short`, `Last_Maintenance Date`, `Notes Text(500)`.

### Communication_Towers — Point

`Tower_ID Long`, `Name Text(150)`, `Coverage Double`, `Tower_Type Short`, `Frequency Double`, `Power_Status Short`, `Signal_Strength Double`, `Status Short`, `Last_Inspection Date`, `Notes Text(500)`.

## Standalone Tables

### Military_Personnel

`Personnel_ID Long`, `Full_Name Text(150)`, `Code_Name Text(100)`, `Rank Short`, `Specialty Short`, `Unit_Name Text(100)`, `Military_No Text(50)`, `Status Short`, `Base_IDFK GUID`, `Checkpoint_IDFK GUID`, `Warehouse_IDFK GUID`, `Join_Date Date`, `Phone Text(30)`, `Address Text(250)`, `Notes Text(500)`.

### Military_Vehicles

`Vehicle_ID Long`, `Base_IDFK GUID`, `Vehicle_Name Text(100)`, `Vehicle_Type Short`, `Military_Number Text(50)`, `Status Short`, `Fuel_Consumption Double`, `Last_Maintenance Date`, `Readiness Short`, `Crew_Count Short`, `Notes Text(500)`.

### Weapons_Inventory

`Weapon_ID Long`, `Warehouse_IDFK GUID`, `Weapon_Name Text(100)`, `Weapon_Type Short`, `Quantity Long`, `Status Short`, `Supply_Date Date`, `Expiry_Date Date`, `Notes Text(500)`.

### Intelligence_Reports

`Report_ID Long`, `Threat_IDFK GUID`, `Title Text(200)`, `Source_Type Short`, `Reliability Short`, `Report_Date Date`, `Content Text(4000)`, `Attachments Text(500)`.

### Military_Incidents

`Incident_ID Long`, `Sector_IDFK GUID`, `Threat_IDFK GUID`, `Name Text(100)`, `Incident_Type Short`, `Incident_Date Date`, `Casualties Short`, `Fatalities Short`, `Description Text(1000)`.

### Communication_Devices

`Device_ID Long`, `Tower_IDFK GUID`, `Device_Type Short`, `Frequency Double`, `Range_KM Double`, `Encryption Short`, `Status Short`.

### Maintenance_Records

`Maintenance_ID Long`, `Asset_Type Short`, `Asset_ID GUID`, `Maintenance_Date Date`, `Maintenance_Type Short`, `Cost Double`, `Technician Text(100)`, `Notes Text(500)`.

### System_Users

`User_ID Long`, `Username Text(50)`, `Password_Hash Text(255)`, `Role Short`, `Last_Login Date`, `Status Short`. جميع القيم اصطناعية ولا تستخدم للمصادقة الفعلية.

### Audit_Log

`Log_ID Long`, `User_IDFK GUID`, `Action Text(100)`, `Table_Name Text(100)`, `Action_Date Date`, `Device_IP Text(50)`.

### Attachments_Metadata

`Attachment_ID Long`, `File_Name Text(255)`, `File_Path Text(500)`, `File_Type Text(50)`, `File_Size Double`, `Upload_Date Date`, `Reference_ID GUID`, `Reference_Table Text(100)`.

## Coded Value Domains المعتمدة

- `Base_Type`: 1 Land Base، 2 Air Base، 3 Naval Base، 4 Command Center، 5 Training Camp.
- `Base_Status`: 1 Active، 2 Reserve، 3 Damaged، 4 Closed.
- `Checkpoint_Type`: 1 Fixed، 2 Mobile، 3 Temporary، 4 Border.
- `Sector_Type`: 1 Urban، 2 Rural، 3 Mountain، 4 Desert، 5 Border.
- `Yes_No`: 0 No، 1 Yes للحقول الثنائية الملائمة.
- الحقول الرقمية الأخرى لا تحصل على Domain مخترع؛ يضاف Domain فقط عند توثيق قيمه.

## Relationship Classes القانونية

| Origin | Destination | Cardinality | Origin key | Foreign key |
|---|---|---|---|---|
| `Military_Bases` | `Military_Personnel` | 1:M | `GlobalID` | `Base_IDFK` |
| `Military_Bases` | `Military_Vehicles` | 1:M | `GlobalID` | `Base_IDFK` |
| `Military_Warehouses` | `Weapons_Inventory` | 1:M | `GlobalID` | `Warehouse_IDFK` |
| `Threat_Areas` | `Intelligence_Reports` | 1:M | `GlobalID` | `Threat_IDFK` |
| `Communication_Towers` | `Communication_Devices` | 1:M | `GlobalID` | `Tower_IDFK` |
| `Operation_Sectors` | `Military_Incidents` | 1:M | `GlobalID` | `Sector_IDFK` |

## Topology Rules للنواة

- `Operation_Sectors`: Must Not Overlap.
- `Patrol_Routes`: Must Not Self-Intersect.
- `Supply_Routes`: Must Not Self-Intersect.

## Validation Rules

- النسب المئوية بين 0 و100.
- العدادات والكميات والسعات غير سالبة.
- معرفات الأعمال فريدة داخل العنصر.
- التواريخ المستقبلية غير مسموحة لحقول Last Update/Inspection/Maintenance.
- النصوص تلتزم بالطول المحدد ولا تحتوي أسرارًا حقيقية.


