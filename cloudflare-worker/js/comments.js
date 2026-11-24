// Comments widget: loads and posts comments via the Worker's /api/comments.
(function () {
  const root = document.getElementById("comments");
  if (!root) return;

  const post = root.dataset.postId;
  const list = root.querySelector(".comment-list");
  const empty = root.querySelector(".comment-empty");
  const count = root.querySelector(".comment-count");
  const form = root.querySelector(".comment-form");
  const status = form.querySelector(".comment-status");
  const button = form.querySelector("button[type=submit]");
  let total = 0;

  const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

  function render(c) {
    const li = document.createElement("li");
    li.className = "comment";
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.className = "comment-name";
    name.textContent = c.name;
    const time = document.createElement("time");
    time.dateTime = c.created_at;
    time.textContent = dateFmt.format(new Date(c.created_at));
    meta.append(name, " · ", time);
    const body = document.createElement("p");
    body.className = "comment-body";
    body.textContent = c.body;
    li.append(meta, body);
    list.append(li);
    total += 1;
    updateCount();
  }

  function updateCount() {
    count.textContent = total ? `(${total})` : "";
    empty.hidden = total > 0;
  }

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle("is-error", !!isError);
  }

  fetch(`/api/comments?post=${encodeURIComponent(post)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      data.comments.forEach(render);
      updateCount();
    })
    .catch(() => {
      empty.textContent = "Comments couldn't be loaded right now.";
      empty.hidden = false;
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get("name") || "").trim();
    const body = (fd.get("body") || "").trim();
    if (!name || !body) {
      setStatus("Both a name and a comment are required.", true);
      return;
    }

    button.disabled = true;
    setStatus("Posting…");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post, name, body, website: fd.get("website") || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't post your comment.");
      if (data.comment) render(data.comment);
      form.elements.body.value = "";
      setStatus("Thanks — your comment is posted.");
    } catch (err) {
      setStatus(err.message || "Couldn't post your comment.", true);
    } finally {
      button.disabled = false;
    }
  });
})();
