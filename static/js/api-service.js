//eslint-disable-next-line no-unused-vars
let apiService = (function () {
  "use strict";

  let module = {};

  /*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) id 
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date /
  */

  // add an image to the gallery
  module.addImage = function (title, imageFile) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    const formData = new FormData();
    formData.append("title", title);
    formData.append("imageFile", imageFile);

    return fetch("/api/images", {
      method: "POST",
      headers: { Authorization: token },
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  // delete an image from the gallery given its id
  module.deleteImage = function (id) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch(`/api/images/${id}`, {
      method: "DELETE",
      headers: { Authorization: token },
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  // fetch a single image by id
  module.getImageById = function (id) {
    const token = localStorage.getItem("token");

    if (token) {
      return fetch(`/api/images/${id}`, {
        headers: { Authorization: token },
      }).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });
    }

    return fetch(`/api/images/${id}`).then((res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  // module.getImages = function () {
  //   return fetch("/api/images").then((res) => {
  //     if (!res.ok) throw new Error(res.statusText);
  //     return res.json();
  //   });
  // };

  module.getImages = function (limit = 1, cursor, id) {
    const token = localStorage.getItem("token");
    let headers = {};
    if (token) {
      headers.Authorization = token;
    }
    const url = new URL(`/api/galleries/${id}/images`, window.location.origin);
    url.searchParams.set("limit", limit);
    if (cursor) url.searchParams.set("cursor", cursor);
    return fetch(url, { headers }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json(); // { images: [...], nextCursor: "..." }
    });
  };

  module.getImageCount = function (id) {
    const token = localStorage.getItem("token");
    if (token) {
      return fetch(`/api/galleries/${id}/images/count`, {
        headers: { Authorization: token },
      }).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json().then((data) => data.count);
      });
    }
    return fetch(`/api/galleries/${id}/images/count`).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json().then((data) => data.count);
    });
  };

  ////////// COMMENTS //////////

  module.getComments = function (imageId, limit = 10, page = 1) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));
    const url = new URL(
      `/api/images/${imageId}/comments`,
      window.location.origin
    );
    url.searchParams.set("limit", limit);
    url.searchParams.set("page", page);
    return fetch(url, {
      headers: { Authorization: token },
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json(); // returns { page, limit, comments }
    });
  };

  // add a comment to an image
  module.addComment = function (id, content) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch(`/api/images/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ content }),
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: token },
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  module.getCommentsCount = function (imageId) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch(`/api/images/${imageId}/comments/count`, {
      headers: { Authorization: token },
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json().then((data) => data.count);
    });
  };

  module.getCommentById = function (commentId) {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch(`/api/comments/${commentId}`, {
      headers: { Authorization: token },
    }).then((res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  ////////// user //////////
  module.signUp = function (username, password) {
    return fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  module.signIn = function (username, password) {
    return fetch("/api/users/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      // store recived token in localStorage
      return res.json().then((user) => {
        localStorage.setItem("token", user.token);
        return user;
      });
    });
  };

  module.signOut = function () {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch("/api/users/signout", {
      method: "GET",
      headers: { Authorization: token },
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      localStorage.removeItem("token");
      return res.json();
    });
  };

  module.getCurrentUser = function () {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("Not authenticated"));

    return fetch("/api/users/me", {
      headers: { Authorization: token },
    }).then((res) => {
      if (res.status === 401) return false;
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  };

  /////////// Galleries ///////////
  module.getGalleries = function (limit = 10, cursor) {
    const url = new URL("/api/galleries", window.location.origin);
    url.searchParams.set("limit", limit);
    if (cursor) url.searchParams.set("cursor", cursor);

    return fetch(url).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json(); // { galleries: [...], nextCursor: "..." }
    });
  };

  module.getGalleryCount = function () {
    return fetch("/api/galleries/count").then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json().then((data) => data.count);
    });
  };

  return module;
})();
