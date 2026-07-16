const mid = new URL(window.location.href).searchParams.get("mid");
window.location.replace(`index.html?type=2${mid ? `&mid=${encodeURIComponent(mid)}` : ""}`);
