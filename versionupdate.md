# SchemaForge Studio Version History

## Version 1.3.1 (Current)
* **Global Object Selector**: Added ability to select any standard or custom SObject globally from a searchable dropdown field.
* **Context Decoupling**: Extension no longer requires being on the Salesforce Object Manager page to operate; you can now generate FMDs anywhere.
* **Domain Validation Safeties**: The extension now instantly blocks execution and shows an Error Modal if you attempt to launch it on a non-Salesforce website (like google.com or chrome:// extensions).
* **Smart Session Retrieval**: Fixed cross-origin redirect token loss (401 errors) by having the Service Worker autonomously rewrite `lightning` domains to the pure `.my.salesforce.com` API origin and capturing its specific active session.
* **UI/UX Polishing**: Replaced the native HTML `<select>` with a professional React-built dropdown component featuring Search capabilities and Custom/Standard badges.
* **Architecture Sync**: Updated `Architecture.md` to reflect the updated decoupled object selection flow and precise Service Worker behavior schemas.

## Version 1.2.1
* **Configurable Integrations**: Removed the "Include System Fields" toggle. Added configurable text inputs in Settings to assign specific integration Profile names and Permission Set names to validate Field Access securely.
* **Numeric Precision Bugfix**: Excel generator formats were corrected so `double(18,15)` produces `(3,15)` precision/scale rules natively.
* **AccessLens Launch**: A dedicated "Field Access" tab was deployed to map object Field-Level Security based on integrated permission models.
* **Architecture Baseline**: Created initial structured architecture document mapping State, Diagrams, and Data flow.

## Version 1.0.0
* Initial MVP launch.
* FMD mapping generation pipeline.
* Configurable Settings Store.
* Object Setup page dependency required to load initial component context.
