# SF FMD Generator Chrome Extension to BigQuery

A Chrome Extension for Salesforce professionals to generate BigQuery Field Mapping Documents (FMD) from Salesforce Object Metadata.

## Features
- **Auto-Detection**: Identifying the current Salesforce object from the active tab.
- **Metadata Fetch**: Uses Salesforce Describe API to pull all field details.
- **Field Selection**: Filterable grid to select specific fields.
- **Virtual Fields**: Add fields that don't exist in Salesforce but are needed in the target schema.
- **Type Mapping**: Configurable mapping from Salesforce Types (e.g., `string`, `currency`) to BigQuery Types (`STRING`, `NUMERIC`, `TIMESTAMP`).
- **Excel Export**: Generates a formatted `.xlsx` file ready for documentation or ETL specs.
- **Accenture Theme**: compliant Light/Dark mode UI.

## Installation

1.  **Clone or Download** this repository to a local folder.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle in top-right).
4.  Click **Load unpacked**.
5.  Select the folder containing `manifest.json` (the root of this project).

## Usage

1.  Login to your **Salesforce** instance (Lightning Experience recommended).
2.  Navigate to an **Object Manager** page or a **Record** page for the object you want to document (e.g., `Account`, `Opportunity`).
3.  Click the **SF FMD Generator** extension icon in the Chrome toolbar.
4.  **Fields Tab**:
    - The extension will auto-detect the object name.
    - Fields will load automatically.
    - Search/Filter and verify the selection.
    - Click **+ Add Virtual Field** to add custom columns if needed.
5.  **Mapping Rules Tab**:
    - Review how Salesforce types map to BigQuery.
    - Adjust if necessary (e.g., map `id` to `STRING`).
    - Click **Save Rules** to persist preferences.
6.  **Generate**:
    - Click **Generate FMD**.
    - The Excel file will download automatically with the naming convention `FMD_<ObjectName>_<YYYYMMDD>.xlsx`.

## Project Structure

-   `manifest.json`: Extension configuration (Manifest V3).
-   `popup.html` / `popup.js`: The main UI logic.
-   `content.js`: Script injected into Salesforce to read context.
-   `background.js`: Service worker for session handling.
-   `utils/salesforceApi.js`: Interacts with Salesforce REST API.
-   `mappingEngine.js`: Handles type conversion logic.
-   `excelGenerator.js`: Builds the Excel file using `exceljs`.
