$(document).ready(function () {
  $("#logout").click(function () {
    $.ajax({
      type: "GET",
      url: "/logout",
      success: function (response) {
        window.location.href = "/";
      },
      error: function (xhr, status, error) {
        console.error(xhr.responseText);
      },
    });
  });
});

// -- ** -- \\

$(".sendButton").on("click", function () {
  var index = $(".sendButton").index(this);
  var userPrompt = $(".user_prompt").eq(index).val();
  var user_email = "{{ session['user_email'] }}";
  $("#regeneratingMessage").hide();
  $(".sendMessage").hide();
  $(".loadingMessage").show();

  $.ajax({
    type: "POST",
    url: "/decision",
    data: { user_prompt: userPrompt, user_email: user_email },
    success: function (data) {
      $(".center-message").animate({ opacity: 0 }, "slow");
      $(".sendMessage").show();
      $("#user_prompt").val("");
      $("#regeneratingMessage").hide();
      var reneratedDataContent = $(data).find("#renerated-data").html();
      $("#renerated-data").append(reneratedDataContent);
    },
    error: function (error) {
      console.error("Error:", error);
      $(".center-message").animate({ opacity: 0 }, "slow");
    },
    complete: function () {
      $(".loadingMessage").hide();
    },
  });
});

$(document).ready(function () {
  $(document).on("click", ".feedback-like-button", function (event) {
    event.preventDefault();
    var $form = $(this).closest("form");
    var prompt = $form.find(".prompt").val();
    var feedbackType = $form.find(".feedback_type").val();
    var feedbackText = $form.find(".feedback-like-text").val();
    var abusive = $form.find(".abusive").val();
    var harmful = $form.find(".harmful").val();
    var userEmail = "{{ session['user_email'] }}";
    $.ajax({
      type: "POST",
      url: "/feedback",
      data: {
        prompt: prompt,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
        abusive: abusive,
        harmful: harmful,
        user_email: userEmail,
      },
      success: function (data) {
        $form[0].reset();
        $(".modal").hide();
        $("#thankYouModal").show();
        setTimeout(function () {
          $("#thankYouModal").hide();
        }, 2000);
      },
      error: function (error) {
        console.error("Error:", error);
      },
    });
  });
});

$(document).ready(function () {
  $(document).on("click", ".regenerateButton", function (e) {
    e.preventDefault();

    $(".sendMessage").hide();
    $(".loadingMessage").show();

    var $form = $(this).closest("form");
    var userPrompt = $form.find(".regenerateUserPrompt").val();
    var user_email = "{{ session['user_email'] }}";
    $form.find(".regeneratingMessage").css("display", "block").show();
    $.ajax({
      type: "POST",
      url: "/decision",
      data: { user_prompt: userPrompt, user_email: user_email },
      success: function (data) {
        $(".center-message").animate({ opacity: 0 }, "slow");
        var reneratedDataContent = $(data).find("#renerated-data").html();
        $("#renerated-data").append(reneratedDataContent);
        $("#regeneratingMessage").hide();
        $(".sendMessage").show();
        $(".loadingMessage").hide();
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        $(".center-message").animate({ opacity: 0 }, "slow");
        $(".sendMessage").show();
      },
      complete: function () {
        $form.find(".regeneratingMessage").hide();
      },
    });
  });
});

function handleFeedback(feedbackType) {
  var parts = feedbackType.split("-");
  var feedback = parts[0];
  var message = parts.slice(1).join("-");
  $("#feedback_type").val(feedback);
  $("#feedbackBox-" + message).show();
  if (feedback === "dislike") {
    $("#regenerateButton").click();
    $("#dislike-data").show();
  }
  if (feedback === "like") {
    $("#dislike-data").hide();
  }
}

$(document).ready(function () {
  $(".close").click(function () {
    $(".modal").hide();
  });
  $("#submitFeedbackBtn").click(function () {
    $("#feedbackBox").hide();
  });
  $(".thank-you-modal .close").click(function () {
    $("#thankYouModal").hide();
  });
  $(document).on("click", ".share-btn-share", function () {
    $("#shareModal").css("display", "block");
  });
  var userPrompt = "{{ user_prompt }}";
  var divText = $("#share-text").text();
  var socialDivText = $("#social-share").text();
  $("#feedback_type").change(function () {
    var feedbackType = $(this).val();
    if (feedbackType === "like") {
      $("#dislike-data").hide();
    } else {
      $("#dislike-data").show();
    }
  });
});

// -- ** -- \\

$(document).ready(function () {
  let commonQuestions = $(".common-questions");
  $(".common-question").click(function () {
    var promptText = $(this).text().trim();
    $("#user_prompt").val(promptText);
    commonQuestions.slideDown("slow", function () {
      setTimeout(function () {
        commonQuestions.slideUp("slow");
      }, 100);
    });
    $(".center-message").animate({ opacity: 0 }, "slow");
    $("#sendButton").click();
  });

  if ($(".common-questions").not('[style="display: none;"]').length > 0) {
    $("#sendButton").click(function () {
      var commonQuestions = $(
        ".common-questions:not([style='display: none;'])"
      );
      commonQuestions.slideDown("slow", function () {
        setTimeout(function () {
          commonQuestions.slideUp("slow");
        }, 100);
      });
    });
  }

  $(document).on("click", ".regenerateUserPrompt", function () {
    var innerBlock = $(this).closest(".inner-block");
    var userPromptText = innerBlock.find(".UserPrompt").text().trim();
    $("#user_prompt").val(userPromptText);
    $("#sendButton").click();
  });
});

document.addEventListener("DOMContentLoaded", function () {
  function shareOnFacebook(event) {
    var quoteText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(window.location.href) +
        "&quote=" +
        encodeURIComponent(quoteText),
      "_blank"
    );
  }

  function shareOnTwitter(event) {
    var tweetText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText),
      "_blank"
    );
  }

  function shareOnLinkedIn(event) {
    var linkedInText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent(window.location.href) +
        "&summary=" +
        encodeURIComponent(linkedInText),
      "_blank"
    );
  }

  function shareOnTelegram(event) {
    var telegramText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://telegram.me/share/url?url=" +
        encodeURIComponent(window.location.href) +
        "&text=" +
        encodeURIComponent(telegramText),
      "_blank"
    );
  }

  function shareOnWhatsApp(event) {
    var whatsappText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://api.whatsapp.com/send?text=" +
        encodeURIComponent(whatsappText + " - " + window.location.href),
      "_blank"
    );
  }

  function shareOnSkype(event) {
    var skypeText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "https://web.skype.com/share?url=" +
        encodeURIComponent(window.location.href) +
        "&text=" +
        encodeURIComponent(skypeText),
      "_blank"
    );
  }

  function shareViaEmail(event) {
    var emailText = event.target
      .closest(".inner-block")
      .querySelector("blockquote").innerText;
    window.open(
      "mailto:?subject=Check%20out%20this%20content&body=" +
        encodeURIComponent(emailText + "%0A%0A" + window.location.href),
      "_blank"
    );
  }

  var facebookShare = document.getElementById("facebookShare");
  var twitterShare = document.getElementById("twitterShare");
  var linkedInShare = document.getElementById("linkedInShare");
  var telegramShare = document.getElementById("telegramShare");
  var whatsAppShare = document.getElementById("whatsAppShare");
  var skypeShare = document.getElementById("skypeShare");
  var emailShare = document.getElementById("emailShare");

  facebookShare.addEventListener("click", shareOnFacebook);
  twitterShare.addEventListener("click", shareOnTwitter);
  linkedInShare.addEventListener("click", shareOnLinkedIn);
  telegramShare.addEventListener("click", shareOnTelegram);
  whatsAppShare.addEventListener("click", shareOnWhatsApp);
  skypeShare.addEventListener("click", shareOnSkype);
  emailShare.addEventListener("click", shareViaEmail);
});
