# Browser QA notes

The first full R1 run captured all eight neutral views and all six diagnostic maps without page errors. A later checkbox pointer action timed out after 30 seconds under SwiftShader software WebGL. It did not complete the runtime controller checks, and no successful runtime.json was claimed for that run.

The capture tool now checkpoints view measurements, allows longer software-renderer interaction latency, and tests diagnostic input change bindings directly. WASD movement, drag look, view controls and the actual walking controller remain separately exercised. The full run is repeated; evidence/runtime.json records its observed result. The first timeout screenshot is retained as evidence/qa-initial-timeout.png, separate from the eight matched landscape views.
