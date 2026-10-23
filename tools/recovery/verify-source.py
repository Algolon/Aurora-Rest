"""Verify every original source byte and both preserved ZIP layers; run from repo root."""
import hashlib, io, json, stat, zipfile
from pathlib import Path, PurePosixPath
m = json.loads(Path("docs/recovery/SOURCE_MANIFEST.json").read_text())
def sha(b): return hashlib.sha256(b).hexdigest()
def safe(z):
    assert z.testzip() is None
    assert len(z.namelist()) == len(set(z.namelist()))
    for i in z.infolist():
        p = PurePosixPath(i.filename)
        assert not p.is_absolute() and ".." not in p.parts and not stat.S_ISLNK(i.external_attr >> 16), i.filename
for f in m["files"]:
    b = Path(f["path"]).read_bytes()
    assert len(b) == f["size"] and sha(b) == f["sha256"], f["path"]
a = Path(m["archive"]["path"]).read_bytes()
assert len(a) == m["archive"]["size"] and sha(a) == m["archive"]["sha256"]
with zipfile.ZipFile(io.BytesIO(a)) as z:
    safe(z)
    original = json.loads(z.read("SOURCE.json"))
    b = z.read("Aurora-Rest-ENV-P01-Source-Snapshot.zip")
    assert sha(b) == m["nestedSnapshotSha256"] == original["sourceSnapshotSha256"]
    with zipfile.ZipFile(io.BytesIO(b)) as inner:
        safe(inner)
        assert set(inner.namelist()) == {"Aurora-Rest/" + f["path"] for f in m["files"]}
        for f in m["files"]:
            assert sha(inner.read("Aurora-Rest/" + f["path"])) == f["sha256"], f["path"]
print(f"PASS: {len(m['files'])}/{len(m['files'])} source files, original archive, nested snapshot, ZIP CRC and safe paths")
