/* global meact, apiService */
(function () {
  "use strict";

  // Meact state for our images list
  // eslint-disable-next-line no-unused-vars
  const [cursor, getCursor, setCursor] = meact.useState(null);
  // eslint-disable-next-line no-unused-vars
  const [prevCursor, getPrevCursor, setPrevCursor] = meact.useState(null);
  const [currentIdKey, getCurrentId, setCurrentId] = meact.useState(null);

  // Meact state for our gallery
  // eslint-disable-next-line no-unused-vars
  const [galleryId, getGalleryId, setGalleryId] = meact.useState(1);
  // eslint-disable-next-line no-unused-vars
  const [galleryCursor, getGalleryCursor, setGalleryCursor] =
    meact.useState(null);
  // eslint-disable-next-line no-unused-vars
  const [prevGalleryCursor, getPrevGalleryCursor, setPrevGalleryCursor] =
    meact.useState(null);

  // eslint-disable-next-line no-unused-vars
  const [galleryPage, getGalleryPage, setGalleryPage] = meact.useState(1);

  const prevGBtn = document.querySelector("#prevGBtn");
  const nextGBtn = document.querySelector("#nextGBtn");
  const counterGEl = document.querySelector("#galleryCounter");

  // Meact state for our comments list
  const [commentPageKey, getCommentPage, setCommentPage] = meact.useState(0);
  // eslint-disable-next-line no-unused-vars
  const [page, getPage, setPage] = meact.useState(1);

  // Meact state for loading spinner
  const [loadingKey, getLoading, setLoading] = meact.useState(false);

  const galleryEl = document.querySelector(".main-gallery");
  const prevBtn = document.querySelector("#prevBtn");
  const nextBtn = document.querySelector("#nextBtn");
  const deleteBtn = document.querySelector("#deleteBtn");
  const counterEl = document.querySelector("#imageCounter");

  // use classes already made to display the image
  const viewerSection = document.querySelector(".left-panel");
  const viewerTitleEl = viewerSection.querySelector(".viewer-title");
  const viewerAuthorEl = viewerSection.querySelector(".viewer-author");
  const viewerImgEl = viewerSection.querySelector(".viewer-img");

  const emptyMessageEl = document.querySelector(".empty-message");
  const toggleBtn = document.querySelector("#toggleAddImageBtn");

  // comment section
  const commentForm = document.querySelector("#commentForm");
  const commentsListEl = document.querySelector(".comments-list");

  const counterCommentsEl = document.querySelector("#commentsCounter");
  const prevCommentsBtn = document.querySelector("#prevCommentsBtn");
  const nextCommentsBtn = document.querySelector("#nextCommentsBtn");

  const modal = document.querySelector("#addImageModal");
  const closeBtn = document.querySelector("#closeModalBtn");

  const [isAuthenticated, getIsAuthenticated, setIsAuthenticated] =
    meact.useState(false);

  const gallerytitleEl = document.querySelector(".gallery-title");

  meact.useEffect(() => {
    // Check if token is present in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      apiService
        .getCurrentUser(token)
        .then((res) => {
          if (!res) {
            setIsAuthenticated(false);
            localStorage.removeItem("token");
          } else {
            setIsAuthenticated(true);
          }
        })
        .catch((err) => {
          console.error("Failed to authenticate user:", err);
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  window.addEventListener("load", () => {
    setLoading(true);
  });

  // Add loading spinner overlay
  const overlayId = "pageLoadingOverlay";
  const spinnerOverlayMarkup = `
  <div id="${overlayId}" class="overlay" >
    <div class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
`;

  meact.useEffect(() => {
    if (getLoading()) {
      // Only add overlay if not already present
      if (!document.querySelector(`#${overlayId}`)) {
        document.body.insertAdjacentHTML("beforeend", spinnerOverlayMarkup);
      }
    } else {
      // Remove overlay if present
      const overlay = document.querySelector(`#${overlayId}`);
      if (overlay) overlay.remove();
    }
  }, [loadingKey]);

  // Add event listeners for the modal
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  toggleBtn.addEventListener("click", () => {
    modal.classList.toggle("hidden");
  });

  // Add event listeners for gallery navigation buttons
  prevGBtn.addEventListener("click", () => {
    if (getPrevGalleryCursor()) {
      loadGalleryPage({ cursor: getPrevGalleryCursor() });

      checkAuthentication();

      setGalleryPage(getGalleryPage() - 1);
    }
  });

  nextGBtn.addEventListener("click", () => {
    if (getGalleryCursor()) {
      loadGalleryPage({ cursor: getGalleryCursor() });

      checkAuthentication();

      setGalleryPage(getGalleryPage() + 1);
    }
  });

  // Add event listeners for navigation buttons
  prevBtn.addEventListener("click", () => {
    if (getPrevCursor()) {
      loadImagePage({ cursor: getPrevCursor() });

      checkAuthentication();

      setPage(getPage() - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (getCursor()) {
      loadImagePage({ cursor: getCursor() });

      checkAuthentication();

      setPage(getPage() + 1);
    }
  });

  meact.useEffect(() => {
    loadImagePage({
      cursor: getCurrentId() || null, // if cursor is null, load the first page
      initial: true,
    });
    setPage(1);
    setGalleryPage(1);
  }, []);

  // load the first gallery
  function loadGalleryPage({ cursor = null, initial = false } = {}) {
    setLoading(true);

    // checkAuthentication();

    apiService
      .getGalleries(1, cursor)
      .then(({ users: galleries, prevCursor, nextCursor }) => {
        if (initial) {
          setGalleryCursor(getGalleryId());
          // set gallery name to username of the first gallery
          gallerytitleEl.textContent =
            galleries.length > 0
              ? galleries[0].username + "'s Gallery"
              : "No Galleries Available";
          setGalleryPage(1);
        }
        if (galleries.length === 0) {
          setGalleryId(null);
          setGalleryCursor(null);
          setPrevGalleryCursor(null);
          gallerytitleEl.textContent = "No Galleries Available";
        } else {
          setGalleryId(galleries[0].id);
          setGalleryCursor(nextCursor);
          setPrevGalleryCursor(prevCursor);
          gallerytitleEl.textContent =
            galleries[0].username + "'s Gallery" || "No Galleries Available";
        }
        loadImagePage({ initial: true });
      })
      .catch((err) => console.error("Error loading gallery:", err));
  }

  meact.useEffect(() => {
    loadGalleryPage({ initial: true });
  }, []);

  // Load the first page of images
  function loadImagePage({ cursor = null, initial = false } = {}) {
    setLoading(true);

    // checkAuthentication();

    apiService
      .getImages(1, cursor, getGalleryId())
      .then(({ images, prevCursor, nextCursor }) => {
        if (initial) {
          setCursor(getCurrentId());
          setPage(1);
        }
        if (images.length === 0) {
          setCurrentId(null);
          setCursor(null);
          setPrevCursor(null);
        } else {
          setCurrentId(images[0].id);
          setCursor(nextCursor);
          setPrevCursor(prevCursor);
        }
        setCommentPage(0);
      })
      .catch((err) => console.error("Error loading image:", err));
  }

  function renderGallery() {
    const id = getCurrentId();
    const galleryId = getGalleryId();
    if (!galleryId) {
      gallerytitleEl.textContent = "No Galleries Available";
      counterGEl.textContent = "0 of 0";
      counterEl.hidden = true;
      return;
    } else {
      counterEl.hidden = false;
    }
    setLoading(true);

    // checkAuthentication();

    apiService
      .getGalleryCount()
      .then((total) => {
        if (!total) {
          //if there are no galleries, show a message
          gallerytitleEl.textContent = "No Galleries Available";
          counterGEl.textContent = "0 of 0";
          prevGBtn.hidden = true;
          nextGBtn.hidden = true;
          setLoading(false);
          return;
        }

        counterGEl.textContent = total
          ? `Gallery ${getGalleryPage()} of ${total}`
          : "0 of 0";
        prevGBtn.hidden = !getPrevGalleryCursor() || getGalleryPage() === 1;
        nextGBtn.hidden = !getGalleryCursor();
      })
      .catch((err) => console.error("Failed to fetch gallery count:", err));

    apiService
      .getImageCount(getGalleryId())
      .then((total) => {
        if (!total) {
          counterEl.textContent = "0 of 0";
          prevBtn.hidden = true;
          nextBtn.hidden = true;
          deleteBtn.hidden = true;
          setLoading(false);
          return;
        }

        counterEl.textContent = total ? `${getPage()} of ${total}` : "0 of 0";
        prevBtn.hidden = !getPrevCursor() || getPage() === 1;
        nextBtn.hidden = !getCursor();
        deleteBtn.hidden = !id;
      })
      .catch((err) => console.error("Failed to fetch image count:", err));

    galleryEl.classList.toggle("empty", !id);

    if (!id) {
      emptyMessageEl.classList.remove("hidden");
      prevBtn.hidden = true;
      nextBtn.hidden = true;
      deleteBtn.hidden = true;
      return;
    }

    emptyMessageEl.classList.add("hidden");
    modal.classList.add("hidden");
    setLoading(true);
    apiService
      .getImageById(id)
      .then((img) => {
        viewerTitleEl.textContent = img.title;
        viewerAuthorEl.textContent = img.user?.username || "Unknown Author";
        viewerImgEl.src = `/api/images/${img.id}/file`;
        viewerImgEl.alt = `${img.title}`;
        viewerImgEl.onload = function () {
          setLoading(false);
        };
        viewerImgEl.onerror = function () {
          setLoading(false);
          viewerImgEl.alt = "Image not found";
          viewerImgEl.src = ""; // Clear src to avoid broken image icon
        };
      })
      .catch((err) => console.error("Failed to fetch image details:", err));
  }

  // whenever currentIdKey updates, actually paint the gallery
  meact.useEffect(renderGallery, [currentIdKey]);

  // Delete button functionality
  deleteBtn.addEventListener("click", () => {
    const id = getCurrentId();
    setLoading(true);

    checkAuthentication();

    apiService
      .deleteImage(id)
      .then(() => {
        // then load the next available image
        if (getPrevCursor()) {
          setPage(getPage() - 1);
        } else if (getCursor()) {
          setPage(getPage());
        } else {
          setPage(0);
        }

        setCurrentId(getPrevCursor() || getCursor() || null);
        loadImagePage({ cursor: getPrevCursor() || getCursor() || null });
        renderGallery();
      })
      .catch((err) => console.error("Failed to delete image:", err));
  });

  // add image form
  const form = document.querySelector("#addImageForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get("imageTitle").trim();
    //const author = fd.get("imageAuthor").trim();
    const file = fd.get("imageFile");
    if (!title || !file) return alert("Please fill in all fields.");
    setLoading(true);

    checkAuthentication();

    apiService
      .addImage(title, file)
      .then(() => {
        modal.classList.add("hidden");
        loadImagePage({ initial: true });
      })
      .catch((err) => alert("Upload failed: " + err.message))
      .finally(() => form.reset());
  });

  // Render comments for the current image
  function renderComments() {
    commentsListEl.innerHTML = "";
    const id = getCurrentId();
    if (!id || !getIsAuthenticated()) {
      commentsListEl.innerHTML = "";
      prevCommentsBtn.hidden = true;
      nextCommentsBtn.hidden = true;
      counterCommentsEl.hidden = true;
      return;
    }

    const perPage = 10;
    const page = getCommentPage(); // 0-based for frontend, +1 when calling backend
    setLoading(true);

    // checkAuthentication();

    apiService
      .getComments(id, perPage, page + 1)
      .then(({ comments }) => {
        if (!comments || comments.length === 0) {
          const li = document.createElement("li");
          li.className = "comment-item";
          li.innerHTML = `<em>No comments yet.</em>`;
          commentsListEl.appendChild(li);
          prevCommentsBtn.hidden = true;
          nextCommentsBtn.hidden = true;
          counterCommentsEl.hidden = true;
          // setLoading(false);
          return;
        }

        const hasMore = comments.length > perPage;
        const toDisplay = comments.slice(0, perPage);

        toDisplay.forEach((c) => {
          const li = document.createElement("li");
          li.className = "comment-item";
          const dateStr = new Date(c.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          li.innerHTML = `
          <div class="comment-header">
            <span class="comment-author">${c.user?.username}</span>
            <span class="comment-date">${dateStr}</span>
          </div>
          <div class="comment-text">${c.content}</div>
          <button class="comment-delete-btn" data-id="${c.id}"></button>
        `;
          commentsListEl.appendChild(li);
        });

        prevCommentsBtn.hidden = page < 1;
        nextCommentsBtn.hidden = !hasMore;
        counterCommentsEl.hidden = false;
        counterCommentsEl.textContent = `Page ${page + 1}`;
      })
      .catch((err) => {
        console.error("Failed to fetch comments:", err);
        commentsListEl.innerHTML = `<li class="comment-item"><em>Error loading comments.</em></li>`;
      });
  }

  meact.useEffect(renderComments, [commentPageKey]);

  // Handle add comment form submission
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    //const author = document.querySelector("#authorInput").value;
    const content = document.querySelector("#commentInput").value;
    if (!getIsAuthenticated()) {
      alert("You must be signed in to add a comment.");
      commentForm.reset();
      return;
    }

    if (!content) {
      alert("Please enter a comment.");
      commentForm.reset();
      return;
    }

    setLoading(true);

    checkAuthentication();

    apiService
      .addComment(getCurrentId(), content)
      .then(() => {
        commentForm.reset();
        setCommentPage(0);
        renderGallery();
      })
      .catch((err) => alert("Failed to add comment: " + err.message));
  });

  // Handle comment deletion
  commentsListEl.addEventListener("click", (e) => {
    if (!e.target.matches(".comment-delete-btn")) return;
    const commentId = e.target.dataset.id;
    console.log("Deleting comment with ID:", commentId);
    setLoading(true);

    apiService
      .getCommentById(commentId)
      .then((comment) => {
        if (!comment) {
          alert("Comment not found.");
          return;
        }
        // Check if the current user is the author of the comment
        return apiService.getCurrentUser().then((user) => {
          if (user.id !== comment.userId) {
            alert("You can only delete your own comments.");
            return;
          }
          // Proceed to delete the comment
          apiService.deleteComment(commentId).then(() => {
            // Re-render comments after deletion
            setCommentPage(getCommentPage());
            setLoading(false);
          });
        });
      })
      .catch((err) => alert("Failed to fetch comment: " + err.message));
    setLoading(false);
  });

  // galleryid = getGalleryId();
  // apiService.getCurrentUser().then((user) => {
  //   if (user.id !== comment.userId) {
  //     alert("You can only delete your own comments.");
  //     return;
  //   }});

  //   setLoading(true);
  //   apiService.deleteComment(commentId).then(() => {
  //     // Re-render comments after deletion
  //     setCommentPage(getCommentPage());
  //     setLoading(false);
  //   });
  // });

  prevCommentsBtn.addEventListener("click", () => {
    setCommentPage(getCommentPage() - 1);
    setLoading(false);
  });
  nextCommentsBtn.addEventListener("click", () => {
    setCommentPage(getCommentPage() + 1);
    setLoading(false);
  });

  ////// user authentication //////

  const signUpToggle = document.querySelector("#toggleSignupBtn");
  const signUpModal = document.querySelector("#signUpModal");
  const closeSignUpBtn = document.querySelector("#closeSignUpModalBtn");
  //const signInForm = document.querySelector("#signinForm");

  signUpToggle.addEventListener("click", () => {
    //document.querySelector("#signinForm").classList.add("hidden");
    signUpModal.classList.toggle("hidden");
  });

  closeSignUpBtn.addEventListener("click", () => {
    signUpModal.classList.add("hidden");
  });

  // sign up form submission
  const signUpForm = document.querySelector("#signupForm");
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = fd.get("username").trim();
    const password = fd.get("password").trim();
    if (!username || !password) return alert("Please fill in all fields.");
    setLoading(true);

    apiService
      .signUp(username, password)
      .then(() => {
        signUpModal.classList.add("hidden");
        alert("User created successfully! You can now sign in.");
        window.location.reload();
      })
      .catch((err) => alert("Sign up failed: " + err.message))
      .finally(() => {
        signUpForm.reset();
        renderGallery();
        setLoading(false);
      });

    // refresh the page
  });

  const signInToggle = document.querySelector("#toggleSigninBtn");
  const signInModal = document.querySelector("#signInModal");
  const closeSignInBtn = document.querySelector("#closeSignInModalBtn");

  signInToggle.addEventListener("click", () => {
    //document.querySelector("#signinForm").classList.add("hidden");
    signInModal.classList.toggle("hidden");
  });

  closeSignInBtn.addEventListener("click", () => {
    signInModal.classList.add("hidden");
  });

  // sign up form submission
  const signInForm = document.querySelector("#signInForm");
  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = fd.get("username").trim();
    const password = fd.get("password").trim();
    if (!username || !password) return alert("Please fill in all fields.");
    setLoading(true);
    apiService
      .signIn(username, password)
      .then(() => {
        //alert("User signed in successfully!");
        setIsAuthenticated(true);
        signUpModal.classList.add("hidden");
        signInModal.classList.add("hidden");
      })
      .catch((err) => alert("Sign up failed: " + err.message))
      .finally(() => {
        signInForm.reset();
        setLoading(false);
      });
  });

  // sign out button
  const signOutBtn = document.querySelector("#toggleSignOutBtn");
  signOutBtn.addEventListener("click", () => {
    setLoading(true);
    apiService
      .signOut()
      .then(() => {
        setIsAuthenticated(false);
        alert("You have been signed out.");
      })
      .catch((err) => alert("Sign out failed: " + err.message))
      .finally(() => {
        setLoading(false);
      });
  });
  const commentSection = document.querySelector(".right-panel");
  const commentBox = document.querySelector(".comment-box");

  meact.useEffect(() => {
    if (getIsAuthenticated()) {
      // user is in, hide sign-in/up, show sign-out
      signUpToggle.classList.add("hidden");
      signInToggle.classList.add("hidden");
      signOutBtn.classList.remove("hidden");
      commentSection.classList.remove("hidden");
      commentBox.classList.remove("hidden");
      toggleBtn.classList.remove("hidden");
      deleteBtn.classList.remove("hidden");
    } else {
      // user is out,  show sign-in/up, hide sign-out
      signUpToggle.classList.remove("hidden");
      signInToggle.classList.remove("hidden");
      signOutBtn.classList.add("hidden");
      commentSection.classList.add("hidden");
      commentBox.classList.add("hidden");
      toggleBtn.classList.add("hidden");
      deleteBtn.classList.add("hidden");
    }
  }, [isAuthenticated]);

  meact.useEffect(renderGallery, [isAuthenticated]);

  function checkAuthentication() {
    const token = localStorage.getItem("token");
    if (token) {
      apiService
        .getCurrentUser(token)
        .then((res) => {
          if (!res) {
            setIsAuthenticated(false);
            localStorage.removeItem("token");
          } else {
            setIsAuthenticated(true);
          }
        })
        .catch((err) => {
          console.error("Failed to authenticate user:", err);
          setIsAuthenticated(false);
          localStorage.removeItem("token"); // Clear invalid token
        });
    } else {
      setIsAuthenticated(false);
    }
  }
})();
