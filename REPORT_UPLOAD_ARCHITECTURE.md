# MedSynapse Report Upload Architecture

```mermaid
flowchart TD
    A[Doctor uploads a PDF or report image] --> B[React OCR Scanner]
    B --> C[POST /api/ocr/parse-report]

    C --> D{Document type}
    D -->|Text PDF| E[PyMuPDF text extraction]
    D -->|Scanned PDF| F[Render pages at 200 DPI]
    F --> G[Tesseract OCR]
    D -->|Image| H[Grayscale and contrast enhancement]
    H --> G

    E --> I[Raw report text]
    G --> I

    I --> J[Regex and heuristic parameter extraction]
    J --> K[Feature resolution and derived values]
    K --> L[JEV evidence suitability scoring]

    I --> M[Local Gemma structured extraction]
    M --> N{Selected disease pipeline}
    N -->|Diabetes| O[Validate diabetes feature contract]
    N -->|Heart| P[Validate 13 heart features]
    N -->|Breast cancer| Q[Validate 30 WDBC FNA features]

    O --> R{Extraction complete?}
    P --> R
    Q --> R
    R -->|No| S[Needs doctor review]
    R -->|Yes| T[Ready for inference]

    K --> U[SQLite feature evidence store]
    S --> U
    T --> U

    L --> V[Display extracted evidence in OCR workspace]
    U --> V
    V --> W[Doctor reviews and edits model inputs]
    W --> X{Disease model selected}

    X -->|Diabetes| Y[Scaler and voting classifier]
    X -->|Heart| Z[Scaler and heart classifier]
    X -->|Breast cancer| AA[Scaler, PCA and breast classifier]

    Y --> AB[Prediction and risk probability]
    Z --> AB
    AA --> AB

    AB --> AC[Contributing factors and recommendations]
    AB --> AD[SHAP explainability when available]
    AC --> AE[Structured clinical screening report]
    AD --> AE

    AE --> AF[Doctor-facing result card]
    AF --> AG[Print or export A4 report]

    AE -. Optional configured endpoint .-> AH[LLM-generated clinical narrative]
    AH -. Not currently connected to frontend .-> AF

    classDef user fill:#e8f5e9,stroke:#25854a,color:#111;
    classDef frontend fill:#e3f2fd,stroke:#1976d2,color:#111;
    classDef backend fill:#fff8e1,stroke:#f59e0b,color:#111;
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,color:#111;
    classDef storage fill:#fce4ec,stroke:#c2185b,color:#111;
    classDef output fill:#e0f2f1,stroke:#00796b,color:#111;

    class A,W user;
    class B,V,AF,AG frontend;
    class C,D,E,F,G,H,I,J,K,L,N,R backend;
    class M,O,P,Q,Y,Z,AA,AB,AD,AH ai;
    class U storage;
    class S,T,AC,AE output;
```

## Current primary runtime path

```text
Doctor upload -> OCR -> parameter extraction -> doctor review/edit
-> disease model -> risk result -> printable screening report
```

> The LLM narrative and persisted clinician approval are backend foundations that are not yet connected to the current frontend workflow.
