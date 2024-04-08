document.addEventListener("DOMContentLoaded", function () {
  const leftTitles = document.querySelectorAll(".left-title");
  if (leftTitles.length > 0) {
    function typeText(element, text, speed, callback) {
      element.innerHTML = "";
      let index = 0;
      function type() {
        element.innerHTML += text.charAt(index);
        index++;
        if (index < text.length) {
          setTimeout(type, speed);
        } else {
          if (callback) {
            callback();
          }
        }
      }
      type();
    }
    leftTitles.forEach(function (leftTitle) {
      const paragraphs = leftTitle.querySelectorAll("p");
      const speed = 70;
      let currentIndex = 0;
      function animateNext() {
        paragraphs.forEach((paragraph) => {
          paragraph.style.display = "none";
        });
        paragraphs[currentIndex].style.display = "block";
        typeText(
          paragraphs[currentIndex],
          paragraphs[currentIndex].textContent,
          speed,
          () => {
            currentIndex = (currentIndex + 1) % paragraphs.length;
            animateNext();
          }
        );
      }
      animateNext();
    });
  }
});

// ~__~ \\

document.addEventListener("DOMContentLoaded", function () {
  const eyeButtons = document.querySelectorAll(".eye-btn");
  eyeButtons.forEach(function (eyeBtn) {
    const passwordInput = eyeBtn.previousElementSibling;
    eyeBtn.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      const openEye = eyeBtn.querySelector(".open-eye");
      const closeEye = eyeBtn.querySelector(".close-eye");
      openEye.style.display = type === "password" ? "block" : "none";
      closeEye.style.display = type === "password" ? "none" : "block";
    });
  });
});

// --___-- \\

$(document).ready(function () {
  $("#signupWithGoogle").click(function (event) {
    event.preventDefault();
    window.location.href = "/login";
  });

  $("#confirmPassword").keyup(function () {
    var newPassword = $("#newPassword").val();
    var confirmPassword = $("#confirmPassword").val();
    if (newPassword !== confirmPassword) {
      $("#resetBtn").prop("disabled", true);
      $("#newPassword").addClass("error");
      $("#confirmPassword").addClass("error");
      $("#newPassword-error").text("Passwords do not match");
    } else {
      $("#resetBtn").prop("disabled", false);
      $("#newPassword").removeClass("error");
      $("#confirmPassword").removeClass("error");
      $("#newPassword-error").text("");
    }
  });

  $(".user_prompt").on("input", function () {
    this.style.height = "57px";
    this.style.height = this.scrollHeight + "px";
  });

  $(document).on("click", ".share", function () {
    $(".shareModal").addClass("show");
  });

  $(document).on("click", ".overlay", function () {
    $(".shareModal").removeClass("show");
  });

  $(document).on("click", ".like", function () {
    $(".feedback").addClass("show");
  });

  $(document).on("click", ".overlay", function () {
    $(".feedback").removeClass("show");
  });

  $("#user_prompt").keypress(function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $("#sendButton").click();
    }
  });
});
