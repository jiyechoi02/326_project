$(document).ready(function () {
    $("#tabs").tabs();

    let companyName = $("#companyName").html().trim()
    $("#review_form").attr("action", "/companies/" + companyName + "/review")

    $("#rating_stars span").click(function(){
        $(this).parent().children("span").removeClass("on");
        $(this).addClass("on").prevAll("span").addClass("on");
        return false;
    });

    $("#createReviewBtn").click(function(){
        $("#review_form").show();
    });

    $("#cancel").click(function(){
        $("#rating_stars span").parent().children("span").removeClass("on");
        $("#review_form").hide();
    })
    $("#review_form").submit(function(e){
        var stars = $("#rating_stars span").parent().find(".star.on").length;
        $("#rating_text").val(stars);

        $("#rating_stars span").parent().children("span").removeClass("on");
     });
});


 
