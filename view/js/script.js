
$(document).ready(function () {
    $("#tabs").tabs().addClass("ui-tabs-vertical ui-helper-clearfix");
    $("#tabs li").removeClass("ui-corner-top").addClass("ui-corner-left");
    $("#defaultOpen").click();
    var active = $('.active');

    
    $('.tablinks').each(function () {
        $(this).on("click", function () {
            $(this).addClass("active");
            active = $(this);
            $(this).siblings().removeClass("active");
        });
    });

    $('.tablinks').hover(function () {       
        $('.tablinks.active').removeClass('active'); // remove class from previous active item
        $(this).addClass('active'); // item class to the current one
    }, function () {
        $('.tablinks.active').removeClass('active'); // remove class from previous active item
        active.addClass('active'); // item class to the current one
    });
    
});
