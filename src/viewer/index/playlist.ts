const pid = new URL(window.location.href).searchParams.get("pid");
window.location.replace(`index.html?type=3${pid ? `&pid=${encodeURIComponent(pid)}` : ""}`);
