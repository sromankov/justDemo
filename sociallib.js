/*
 class socialInstances()
 manipulates with social instances sets (likes, comments, etc.) that were created
 during page rendering. Is used to reach other instances from the current one
 */
function socialInstances() {

    this.instances = new Array();

    this.redrawNeighbours = true;

    this.instanceExists = function (name) {

        result = false;
        $.each(this.instances, function (index, neighbour) {
                if (neighbour.name == name) {
                    result = true;
                }
            }
        );
        return result;

    }   // socialInstances.instanceExists

    this.addInstance = function (instance) {

        if (!this.instanceExists(instance.name)) {
            this.instances.push(instance);
        }

    }   // socialInstances.addInstance

    this.getNeighbours = function (name) {

        result = new Array();
        $.each(this.instances, function (index, neighbour) {
                if (neighbour.name != name) {
                    result.push(neighbour);
                }
            }
        );
        return result;

    }   // socialInstances.getNeighbours


    this.redrawAllInstances = function(actionsEntity, actionsId) {

        // this will redraw rivvet's (x) likes and comments
        CommentsNeighbours.getCommentsNum(actionsEntity, actionsId);
        LikesNeighbours.getLikesNum(actionsEntity, actionsId);

        // this will redraw typical comments/like blocks
        $.each(this.getNeighbours(''), function (index, neighbour) {
                if (typeof neighbour.stat.redrawCommentsCounter == 'function') {
                    neighbour.stat.redrawCommentsCounter(actionsEntity, actionsId, false);
                }
                if (typeof neighbour.stat.redrawLikesCounter == 'function') {
                    neighbour.stat.redrawLikesCounter(actionsEntity, actionsId, false);
                }
            }
        );

    }


    this.getLikesNum = function (parentEntity, commentId) {

        $.ajax({
            type:"GET",
            url:"/social/likeslib/howmanylikes",
            data:{"entity_key":parentEntity, "id":commentId},
            dataType:"json",
            complete:function (obj, status) {

            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {

                    }
                    else {
                        actionsLikesCount =  data.result;
                        $("#stat-" + parentEntity + "-" + commentId).find(".likes .count-likes").html(actionsLikesCount);

                        actionsIsLiked = data.isLiked;

                        //console.log("Is liked " + actionsIsLiked);
                        var parent = $("#stat-" + parentEntity + "-" + commentId).parents(".revvboard-item")[0];
                        controlsBlock = $(parent).find(".like-in-list");
                        if (actionsIsLiked) {
                            $(controlsBlock).data("isliked", 1);
                            $(controlsBlock).find("span.likes").html("UnLike");
                        }
                        else {
                            $(controlsBlock).data("isliked", 0);
                            $(controlsBlock).find("span.likes").html("Like");
                        }





                    }
                }
            }
        });


    }

    this.getCommentsNum = function (parentEntity, commentId) {

        $.ajax({
            type:"GET",
            url:"/social/commentslib/howmanycomments",
            data:{"entity_key":parentEntity, "id":commentId},
            dataType:"json",
            complete:function (obj, status) {

            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {

                    }
                    else {
                        actionsCommentsCount =  data.result;
//                        console.log(actionsCommentsCount);
//                        console.log("#stat-" + parentEntity + "-" + commentId);
                        $("#stat-" + parentEntity + "-" + commentId).find(".comments .count-comments").html(actionsCommentsCount);

                    }
                }
            }
        });


    }


}   // socialInstances

/*
 class socialBlocks()
 manipulates with social blocks sets (comments, etc.) that were created
 during page rendering. Is used to reach other blocks from the current one
 */
function socialBlocks() {

    this.blocks = new Array();
    this.redrawNeighbours = true;

    this.blockExists = function (name) {

        result = false;
        $.each(this.blocks, function (index, neighbour) {
                if (neighbour.basename == name) {
                    result = true;
                }
            }
        );
        return result;

    }   // socialBlocks.blockExists

    this.addBlock = function (block) {

        if (!this.blockExists(block.basename)) {
            this.blocks.push(block);
        }

    }   // socialBlocks.addBlock

    this.getNeighbours = function (name) {

        result = new Array();
        $.each(this.blocks, function (index, neighbour) {
                if (neighbour.basename != name) {
                    result.push(neighbour);
                }
            }
        );
        return result;

    }   // socialBlocks.getNeighbours

}   // socialBlocks

/*
 We are using these sets at the moment
 */
var LikesNeighbours = new socialInstances();
var CommentsNeighbours = new socialInstances();
var HelpfulNeighbours = new socialInstances();
var RatesNeighbours = new socialInstances();

/*
 class commentsInstance
 Consists of the methods to manipulate comments block, comments form and comments counters as a unified set,
 The behavior of this set instance can affect other similar sets and counters
 */
function commentsInstance(parentEntity, parentId, name, form) {

    if (name == undefined) {
        name = 'default';
    }
    this.name = name;
    this.form = form;
    this.parentEntity = parentEntity;
    this.parentId = parentId;
    this.stat = null;
    this.block = null;

    CommentsNeighbours.addInstance(this);

}   // commentsInstance

/*
 class LikesInstance
 Consists of the methods to manipulate likes counters, The behavior of this set
 instance can affect other sets and counters
 */
function LikesInstance(parentEntity, parentId, name) {

    if (name == undefined) {
        name = 'default';
    }
    this.name = name;
    this.parentEntity = parentEntity;
    this.parentId = parentId;
    this.stat = null;

    LikesNeighbours.addInstance(this);

}   // LikesInstance

/*
 class HelpfulInstance
  */
function HelpfulInstance(parentEntity, parentId, name) {

    if (name == undefined) {
        name = 'default';
    }
    this.name = name;
    this.parentEntity = parentEntity;
    this.parentId = parentId;
    this.stat = null;

    HelpfulNeighbours.addInstance(this);

}   // HelpfulInstance

/*
 class RateInstance
 */
function RatesInstance(parentEntity, parentId, name) {

    if (name == undefined) {
        name = 'default';
    }
    this.name = name;
    this.parentEntity = parentEntity;
    this.parentId = parentId;
    this.stat = null;

    RatesNeighbours.addInstance(this);

}   // RatesInstance


/*
 class commentsForm
 Consists of methods for comments form manipulation. commentsForm instances are highly linked to comments
 block instances, one to many at the moment.
 */
function commentsForm(name, isVisible, changeScroll) {

    this.name = name;
    this.currentInstance = null;
    this.currentEntity = null;
    this.currentId = null;
    this.previousInstance = null;
    this.previousEntity = null;
    this.previousId = null;
    this.currentInstance = null;
    this.linkedCommentBlocks = new Array();
    this.inProgress = false;

    if (isVisible == undefined) {
        isVisible = false;
    }

    this.visible = isVisible;

    this.changeScroll = null;

    if (undefined !== changeScroll)
    {
        this.changeScroll = changeScroll;
    }


    this.getLinkedBlock = function () {

        var thisObj = this;
        result = null;
        $.each(this.linkedCommentBlocks, function (index, block) {
                if (block.commentsInstance.name == thisObj.currentInstance) {
                    result = block;
                }
            }
        );
        return result;

    }   // commentsForm.getLinkedBlock

    this.linkCommentBlock = function (commentblock) {

        this.linkedCommentBlocks.push(commentblock);

    }   // commentsForm.linkCommentBlock

    this.submit = function () {

        var thisObj = this;

        if (!thisObj.inProgress) {
            thisObj.inProgress = true;


        data = $("#" + this.name).serialize();
        var commentText = $("#" + this.name).find('textarea[name="comment_text"]').val();
        data = data + "&basename=" + thisObj.getLinkedBlock().commentsInstance.name;
        //var iframe = $("#" + this.name).parents("iframe")[0];

        $.ajax({
            type:"POST",
            url:"/social/commentslib/save",
            data:data,
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                thisObj.inProgress = false;
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                        // disposing wrong fields
                        $('input').removeClass('error');
                        $('textarea').removeClass('error');
                        $('#comment_text_error, #poster_name_error, #captcha_error').html('');

                        $('#message_body_error').html('');
                        fullDescription = "";

                        $.each(data.errors, function (key, value) {
                            $('#' + thisObj.name + ' input[name="' + key + '"]').addClass('error');
                            $('#' + thisObj.name + ' textarea[name="' + key + '"]').addClass('error');
                            $("textarea[name=\"" + key + "\"]").focusin(
                                function () {
                                    $("#allmessage_error").html("");
                                    $("#allmessage_error").hide();
                                    $("textarea[name=\"" + key + "\"]").removeClass("error");
                                }
                            );
                            $("input[name=\"" + key + "\"]").focusin(
                                function () {
                                    $("#allmessage_error").html("");
                                    $("#allmessage_error").hide();
                                    $("input[name=\"" + key + "\"]").removeClass("error");
                                }
                            );

                            $.each(value, function (errortype, description) {
                                fullDescription = fullDescription + "<p>" + description + "</p>";
                            });
                            if (fullDescription != "") {
                                $("#allmessage_error").html("<div> " + fullDescription + " </div><span></span>");
                                $("#allmessage_error").show();
                            }
                        });
                        $("input[name=\"recaptcha_response_field\"]").change(
                            function () {
                                $("#allmessage_error").html("");
                                $("#allmessage_error").hide();
                                $("input").removeClass("error");
                            }
                        );
                    }
                    else {
                        var newComment = data.commentid;
                        // clear error messages
                        $('#comment_text_error, #poster_name_error, #captcha_error').html('');


                        func = function () {
                        }
                        thisObj.getLinkedBlock().commentsInstance.stat.redrawCommentsCounter(thisObj.currentEntity, thisObj.currentId);
                        if (data.commenttopcommentid == 0) {
                            // top level comment
                            appendPlaceholder = thisObj.getLinkedBlock().commentsInstance.name + '-' + thisObj.getLinkedBlock().commentsInstance.parentEntity + '-' + thisObj.getLinkedBlock().commentsInstance.parentId + '-append';
                        }
                        else {
                            appendPlaceholder = thisObj.getLinkedBlock().commentsInstance.name + '-comments-' + data.commenttopcommentid + '-append';

                        }
                        thisObj.getLinkedBlock().unHighlightComment(data.commentparentid);
                        $("#" + appendPlaceholder).before(data.rendered_comment);

                        $('form#' + thisObj.name + ' textarea[name="comment_text"]').val("");
                        thisObj.hide();
                        thisObj.getLinkedBlock().scrollToComment(newComment);
                        thisObj.getLinkedBlock().hideComment(newComment);
                        thisObj.getLinkedBlock().blinkComment(newComment);

                        if (null !== thisObj.changeScroll)
                        {
                            console.log(commentText, thisObj.currentId, $('body'));
                            thisObj.changeScroll();
                        }
                    }
                }
            }
        });
        if (typeof Recaptcha != 'undefined') {
            Recaptcha.reload();
        }

        }

    }   // commentsForm.submit

    this.show = function () {

        formPlaceholder = this.currentInstance + '-' + this.currentEntity + '-' + this.currentId + '-form';
        $('form#' + this.name).show();
        this.visible = true;
        $('input[placeholder], textarea[placeholder]').placeholder();

    }   // commentsForm.show

    this.hide = function () {

        formPlaceholder = this.currentInstance + '-' + this.currentEntity + '-' + this.currentId + '-form';
        $('form#' + this.name).hide();
        this.visible = false;

    }   // commentsForm.hide

    this.focus = function () {

        //$('body, html').scrollTo('form#' + this.name, 800, {offset:{top:-40} });

        $('html, body').animate({
            scrollTop: $('form#' + this.name).offset().top-40
        }, 800);


    }   // commentsForm.focus

    this.moveToEntity = function (instance, entity, id) {

        this.previousInstance = this.currentInstance;
        this.previousEntity = this.currentEntity;
        this.previousId = this.currentId;
        this.currentId = id;
        this.currentEntity = entity;
        this.currentInstance = instance;
        $('form#' + this.name + ' input[name="parent_id"]').val(this.currentId);
        $('form#' + this.name + ' input[name="parent_entity_key"]').val(this.currentEntity);
        $('form#' + this.name + ' textarea[name="comment_text"]').val("");
        if (typeof Recaptcha != 'undefined') {
            Recaptcha.reload("t"); // reloads captcha without a focusing
        }
        // form relocation
        formPlaceholder = this.currentInstance + '-' + this.currentEntity + '-' + this.currentId + '-form';
        $('form#' + this.name).detach().insertAfter('#' + formPlaceholder);

    }   // commentsForm.moveToEntity

}   // commentsForm

/*
 class HelpfulBlock
 Consists of methods for entity usefulness manipulation for registered users
 */
function HelpfulBlock (helpfulInstance) {

    this.helpfulInstance = helpfulInstance;
    this.helpfulInstance.block = this;
    this.basename = this.helpfulInstance.name;
    var thisObj = this;

    this.sayYesNo = function (parentEntity, parentId, action) {
        $.ajax({
            type:"GET",
            url:"/social/helpfullib/setyesno",
            data:{"entity_key":parentEntity, "id":parentId, "yesno" : action, "basename":thisObj.basename},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                //alert (action + ' ' + parentEntity + ' ' + parentId);
                thisObj.helpfulInstance.stat.redrawHelpfulStat(parentEntity, parentId);
                thisObj.redrawYesNo(parentEntity, parentId);
            }
        });

    }   // HelpfulBlock.sayYesNo

    this.redrawYesNo = function (parentEntity, parentId, redrawMore) {

        if (typeof redrawMore == 'undefined') {
            redrawMore = true;
        }
        $.ajax({
            type:"GET",
            url:"/social/helpfullib/getyesno",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.basename},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        container = thisObj.helpfulInstance.name + '-' + parentEntity + '-' + parentId + '-helpfulblock';
                        $("#" + container).replaceWith(data.result);
                        // redraw this object in all other entities

                        if (HelpfulNeighbours.redrawNeighbours && redrawMore) {
                            $.each(HelpfulNeighbours.getNeighbours(thisObj.helpfulInstance.name), function (index, neighbour) {
                                    neighbour.block.redrawYesNo(parentEntity, parentId, false);
                                    neighbour.stat.redrawHelpfulStat(parentEntity, parentId, false);
                                }
                            );
                        }
                    }
                }
            }
        });
    }
}   // HelpfulBlock.redrawYesNo

/*
 class commentsBlock
 manipulates with 2-level comments blocks, linked forms and counters
 */
function commentsBlock(commentsInstance, form, disablePopup, changeScroll) {

    this.commentsInstance = commentsInstance;
    this.commentsInstance.block = this;
    this.form = form;
    this.form.linkCommentBlock(this);
    this.form.moveToEntity(commentsInstance.name, commentsInstance.parentEntity, commentsInstance.parentId);

    if (!this.form.visible) {
        this.form.hide();
    }

    this.basename = this.commentsInstance.name;
    var thisObj = this;

    this.disablePopup = null;

    if (undefined !== disablePopup)
    {
        this.disablePopup = disablePopup;
    }
    this.changeScroll = null;

    if (undefined !== changeScroll)
    {
        this.changeScroll = changeScroll;
    }

    this.init = function () {

        this.expandNextComments(this.commentsInstance.parentEntity, this.commentsInstance.parentId, 0);

    }   // commentsBlock.init

    this.deleteAllChildren = function (parentEntity, parentId, checkForm) {

        if (typeof checkForm == 'undefined') {
            checkForm = true;
        }
        children = this.basename + '-' + parentEntity + '-' + parentId + '-children > .comment'
        // The form can be somewhere in child entity, so we have to pop it out
        this.parkForm();
        $('#' + children).remove();
        return false;

    }   // commentsBlock.deleteAllChildren

    this.expandSecondLevelComments = function (parentEntity, parentId, from) {

        // from = 0 - first portion, from > 0 - all
        $.ajax({
            type:"GET",
            url:"/social/commentslib/expandsecondlevelcomments",
            data:{"parent_entity_key":parentEntity, "parent_id":parentId, "from":from, "basename":thisObj.basename},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                insertMarker = thisObj.basename + '-' + parentEntity + '-' + parentId + '-append';
                seemoreMarker = thisObj.basename + '-' + parentEntity + '-' + parentId + '-seemore';
                $("#" + seemoreMarker).remove();
                expandMore = data.expandmore;
                if (from > 0) {
                    childrensMarker = thisObj.basename + '-' + parentEntity + '-' + parentId + '-children';
                    $("#" + childrensMarker + " > div.comment").remove();
                }
                $.each(data.results, function (i, item) {
                    comment_render = item.rendered_comment;


                $("#" + insertMarker).before(comment_render);


                });
                if (null !== thisObj.changeScroll)
                {
                    thisObj.changeScroll();
                }
            }

        });

    }   //commentsBlock.expandSecondLevelComments

    this.expandNextComments = function (parentEntity, parentId, from) {

        $.ajax({
            type:"GET",
            url:"/social/commentslib/expandnextcomments",
            data:{"parent_entity_key":parentEntity, "parent_id":parentId, "from":from, "basename":thisObj.basename},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                insertMarker = thisObj.basename + '-' + parentEntity + '-' + parentId + '-append';
                seemoreMarker = thisObj.basename + '-' + parentEntity + '-' + parentId + '-seemore';
                $("#" + seemoreMarker).remove();
                expandMore = data.expandmore;
                $.each(data.results, function (i, item) {
                    comment_id = item.id;
                    comment_type = item.type;
                    comment_depth = item.depth;
                    comment_children = item.children;
                    comment_render = item.rendered_comment;
                    comment_top_comment_id = item.top_comment_id;
                    // exclude just added comments
                    commentContainer = thisObj.basename + '-' + comment_type + '-' + comment_id;
                    if ($("#" + commentContainer).length > 0) {
                        $("#" + commentContainer).remove();
                    }
                    $("#" + insertMarker).before(comment_render);
                    thisObj.expandSecondLevelComments(comment_type, comment_id, 0);
                });
                if (null !== thisObj.changeScroll)
                {
                    thisObj.changeScroll();
                }
            }
        });

    }   // commentsBlock.expandNextComments

    this.addComment = function (parentEntity, parentId) {

        this.highlightComment(parentId);
        this.form.moveToEntity(this.commentsInstance.name, parentEntity, parentId);
        $('#comment_text_error, #poster_name_error, #captcha_error').html('');
        this.form.show();
        if (null !== thisObj.changeScroll)
        {
            thisObj.changeScroll();
        }
        this.form.focus();
    }   //  commentsBlock.addComment

    this.deleteComment = function (id) {
        var thisObj = this;
        var dialogOptions = {
            title:"Confirm your action",
            buttons:[{
                text:"Yes",
                click:function () {
                    $.ajax({
                        type:"POST",
                        url:"/social/commentslib/delete",
                        data:{"comment_id":id},
                        dataType:"json",
                        complete:function () {
                        },
                        success:function (data, textStatus) {
                            if (textStatus == 'success') {
                                if (data.status != 'ok') {
                                }
                                else {
                                    //redraw parent comments stat
                                    var parentEntityKey = data.top_entity;
                                    var parentId = data.top_id;
                                    thisObj.commentsInstance.stat.redrawCommentsCounter(parentEntityKey, parentId);
                                    var commentContainer = thisObj.commentsInstance.name + '-' + 'comments' + '-' + id;
                                    thisObj.parkForm();
                                    $("#" + commentContainer).remove();
                                    if (null !== thisObj.changeScroll)
                                    {
                                        thisObj.changeScroll();
                                    }
                                }
                            }
                        }
                    });
                    $(this).dialog("close");
                }
            }, {
                text:"No",
                click:function () {
                    $(this).dialog("close");
                }
            }]
        };
        $("#dialog").html("<div style=\"width:150px;\"><div>Are you sure?</div></div>").dialog("option", "position", "center");
        $("#dialog").dialog("option", dialogOptions);

        if (null === thisObj.disablePopup)
        {
            $("#dialog").dialog("open").dialog("option", "position", "center");
        }
        else
        {
            $.ajax({
                type:"POST",
                url:"/social/commentslib/delete",
                data:{"comment_id":id},
                dataType:"json",
                complete:function () {
                },
                success:function (data, textStatus) {
                    if (textStatus == 'success') {
                        if (data.status != 'ok') {
                        }
                        else {
                            //redraw parent comments stat
                            var parentEntityKey = data.top_entity;
                            var parentId = data.top_id;
                            thisObj.commentsInstance.stat.redrawCommentsCounter(parentEntityKey, parentId);
                            var commentContainer = thisObj.commentsInstance.name + '-' + 'comments' + '-' + id;
                            thisObj.parkForm();
                            $("#" + commentContainer).remove();
                            if (null !== thisObj.changeScroll)
                            {
                                thisObj.changeScroll();
                            }
                        }
                    }
                }
            });
        }
    }   //  commentsBlock.deleteComment

    this.entityExists = function (parentEntity, parentId) {

        commentContainer = this.commentsInstance.name + '-' + parentEntity + '-' + parentId;
        if ($("#" + commentContainer).length > 0) {
            return true;
        }
        else {
            return false;
        }

    }   //commentsBlock.entityExists

    this.parkForm = function () {

        this.form.moveToEntity(this.commentsInstance.name, this.commentsInstance.parentEntity, this.commentsInstance.parentId);
        this.form.hide();

    }   //commentsBlock.parkForm

    this.highlightComment = function (commentId, fromCommentId) {

        this.unHighlightAllComments();
        if (typeof fromCommentId != 'undefined') {
            // adding Back link to old comment
            action = 'CB_' + this.commentsInstance.name + '.jumpToComment(' + fromCommentId + ');return';
            backContainer = commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId + ' > div.commentbody > div.first-level > div.backnav';
            $("#" + backContainer).html('<a href="#" onclick="' + action + '">back</a>');
        }
        else {
            $("div.backnav").html('');
        }
        commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId;
        $("#" + commentContainer + " > div.commentbody").addClass('active');

    }   // commentsBlock.highlightComment

    this.blinkComment = function (commentId) {

        commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId;
        //$("#" + commentContainer + " > div.commentbody").effect("pulsate", { times:1}, 1000);
        $("#" + commentContainer + " > div.commentbody").show("fade", {}, 1000);


    }   // commentsBlock.highlightComment

    this.hideComment = function (commentId) {

        commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId;
        $("#" + commentContainer + " > div.commentbody").hide();


    }   // commentsBlock.highlightComment



    this.unHighlightComment = function (commentId) {
        commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId;
        $("#" + commentContainer + " > .commentbody ").removeClass('active');

    }   // commentsBlock.unHighlightComment

    this.unHighlightAllComments = function () {

        commentContainer = this.commentsInstance.name + '-' + this.commentsInstance.parentEntity + '-' + this.commentsInstance.parentId + '-children';
        $("#" + commentContainer + " div.commentbody").removeClass('active');
        $("div.backnav").html('');

    }   // commentsBlock.unHighlightComment

    this.scrollToComment = function (commentId) {
        commentContainer = this.commentsInstance.name + '-' + 'comments' + '-' + commentId;

//        $.scrollTo("#" + commentContainer + " > .commentbody ", 800, {offset:{top:-40}});

        $('html, body').animate({
            scrollTop: $("#" + commentContainer + " > .commentbody ").offset().top-40
        }, 800);


    }   // commentsBlock.scrollToComment

    this.jumpToComment = function (commentId, fromCommentId) {

        this.unHighlightAllComments();
        this.scrollToComment(commentId);
        if (typeof fromCommentId != 'undefined') {
            this.highlightComment(commentId, fromCommentId);
        }
        else {
            this.blinkComment(commentId);
        }
    }   //commentsBlock.jumpToComment

    this.init();

}   //commentsBlock

/*
 class commentsBlock
 manipulates with comments counters and linked comments blocks
 */
function commentsStat(commentsInstance) {

    this.commentsInstance = commentsInstance;
    this.commentsInstance.stat = this;
    var thisObj = this;

    this.redrawCommentsCounter = function (parentEntity, parentId, redrawMore) {

        if (typeof redrawMore == 'undefined') {
            redrawMore = true;
        }
        $.ajax({
            type:"GET",
            url:"/social/commentslib/getcommentsstat",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.commentsInstance.name},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {

                    }
                    else {
                        container = thisObj.commentsInstance.name + '-' + parentEntity + '-' + parentId + '-commentscounter';
                        $("#" + container).replaceWith(data.result);
                        // redraw this object in all other entities
                        if (CommentsNeighbours.redrawNeighbours && redrawMore) {
                            $.each(CommentsNeighbours.getNeighbours(thisObj.commentsInstance.name), function (index, neighbour) {
                                    neighbour.stat.redrawCommentsCounter(parentEntity, parentId, false);
                                    if (neighbour.block.entityExists(parentEntity, parentId)) {
                                        neighbour.block.init();
                                    }
                                }
                            );
                        }
                    }
                }
            }
        });

    }   // commentsStat.getCommentsCounter

}

/*
 class commentsBlock
 manipulates with likes counters and linked comments blocks
 */
function LikesStat(likesInstance) {

    this.likesInstance = likesInstance;
    this.likesInstance.stat = this;
    var thisObj = this;

    this.redrawLikesCounter = function (parentEntity, parentId, redrawMore) {

        if (typeof redrawMore == 'undefined') {
            redrawMore = true;
        }
        $.ajax({
            type:"GET",
            url:"/social/likeslib/getlikesstat",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.likesInstance.name},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        container = thisObj.likesInstance.name + '-' + parentEntity + '-' + parentId + '-likescounter';
                        $("#" + container).replaceWith(data.result);
                        // redraw this object in all other entities
                        if (LikesNeighbours.redrawNeighbours && redrawMore) {
                            $.each(LikesNeighbours.getNeighbours(thisObj.likesInstance.name), function (index, neighbour) {
                                    neighbour.stat.redrawLikesCounter(parentEntity, parentId, false);
                                }
                            );
                        }
                    }
                }
            }
        });

    }   // commentsStat.getCommentsCounter


    this.unlikeEntity = function (parentEntity, commentId) {

        $.ajax({
            type:"GET",
            url:"/social/likeslib/unlikeentity",
            data:{"entity_key":parentEntity, "id":commentId},
            dataType:"json",
            complete:function (obj, status) {

            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        thisObj.redrawLikesCounter(parentEntity, commentId);
                    }
                }
            }
        });

    }   // LikesStat.unlikeEntity

    this.likeEntity = function (parentEntity, commentId) {

        $.ajax({
            type:"GET",
            url:"/social/likeslib/likeentity",
            data:{"entity_key":parentEntity, "id":commentId},
            dataType:"json",
            complete:function (obj, status) {

            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        thisObj.redrawLikesCounter(parentEntity, commentId);
                    }
                }
            }
        });

    }   // LikesStat.likeEntity

}   // LikesStat

function RatesStat(ratesInstance) {

    this.ratesInstance = ratesInstance;
    this.ratesInstance.stat = this;
    var thisObj = this;

    this.redrawRatesCounter = function (parentEntity, parentId, redrawMore) {

        if (typeof redrawMore == 'undefined') {
            redrawMore = true;
        }

        $.ajax({
            type:"GET",
            url:"/social/rateslib/getratesstat",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.ratesInstance.name},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {

                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {

                        container = thisObj.ratesInstance.name + '-' + parentEntity + '-' + parentId + '-ratescounter  span.voteblockt';
                        //alert (container);

                        //$("#" + container).replaceWith(data.result);
                        $("#" + container).html(data.result);
                        $('.star[name="rate' + thisObj.ratesInstance.name + '-' + parentEntity + '-' + parentId + '"]').rating({
                            callback: function(value, link){
                                thisObj.saveRate(parentEntity, 'parentId', value);
                            }
                        });
                        // redraw this object in all other entities


                        if (RatesNeighbours.redrawNeighbours && redrawMore) {
                            $.each(RatesNeighbours.getNeighbours(thisObj.ratesInstance.name), function (index, neighbour) {
                                    neighbour.stat.redrawRatesCounter(parentEntity, parentId, false);
                                    neighbour.stat.hideControl(parentEntity, parentId);
                                }
                            );
                        }

                    }
                }
            }
        });


    }   // RatesStat.redrawRatesCounter
    this.showRateApplet = function(parentEntity, parentId) {

        rateBlock = thisObj.ratesInstance.name + '-' + parentEntity + '-' + parentId + '-ratescounter';
        $("#" + rateBlock + "  .voteblockt").hide("blind", {}, 100);
        $("#" + rateBlock + "  .voteblock").show("blind", {}, 100);
//        $("#" + rateBlock + "  .voteblockt").hide();
        //$("#" + rateBlock + "  .voteblock").show();

        $("#" + rateBlock + "  .votebutton").hide();
    }

    this.hideControl = function (parentEntity, parentId) {
        rateBlock = thisObj.ratesInstance.name + '-' + parentEntity + '-' + parentId + '-ratescounter';
        $("#" + rateBlock + "  .votebutton").hide();
    }

    this.saveRate = function(parentEntity, parentId, value) {
        //alert (value);



        $.ajax({
            type:"GET",
            url:"/social/rateslib/save",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.ratesInstance.name, "value": value},
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {

                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        thisObj.redrawRatesCounter(parentEntity, parentId);

                        rateBlock = thisObj.ratesInstance.name + '-' + parentEntity + '-' + parentId + '-ratescounter';

                        //$("#" + rateBlock + "  .voteblock").hide("blind", {}, 500);
                        $("#" + rateBlock + "  .voteblock").hide();
                        $("#" + rateBlock + "  .voteblockt").show("blind", {}, 300);
//                        $("#" + rateBlock + "  .voteblock").hide();
//                        $("#" + rateBlock + "  .voteblockt").show();

                        thisObj.hideControl(parentEntity, parentId);
                        //$("#" + rateBlock + "  .votebutton").hide();

                    }
                }
            }
        });


    }
}

/*
 class HelpfulStats()
 manipulates with helpful counters (like "N of M people found this useful")
 */
function HelpfulStat(helpfulInstance) {

    this.helpfulInstance = helpfulInstance;
    this.helpfulInstance.stat = this;
    var thisObj = this;

    this.redrawHelpfulStat = function(parentEntity, parentId, redrawMore) {

        if (typeof redrawMore == 'undefined') {
            redrawMore = true;
        }
        $.ajax({
            type:"GET",
            url:"/social/helpfullib/gethelpfulstat",
            data:{"entity_key":parentEntity, "id":parentId, "basename":this.helpfulInstance.name },
            dataType:"json",
            complete:function () {
            },
            success:function (data, textStatus) {
                if (textStatus == 'success') {
                    if (data.status != 'ok') {
                    }
                    else {
                        container = thisObj.helpfulInstance.name + '-' + parentEntity + '-' + parentId + '-helpfulcounter';
                        $("#" + container).replaceWith(data.result);
                        // redraw this object in all other entities

                        if (HelpfulNeighbours.redrawNeighbours && redrawMore) {
                            $.each(HelpfulNeighbours.getNeighbours(thisObj.helpfulInstance.name), function (index, neighbour) {
                                    neighbour.stat.redrawHelpfulStat(parentEntity, parentId, false);
                                    neighbour.block.redrawYesNo(parentEntity, parentId, false);
                                }
                            );
                        }
                    }
                }
            }
        });

    }   // HelpfulStat.redrawHelpfulStat

}   // HelpfulStat


var actionsEntity = '';
var actionsId = '';
var actionsCommentsCount = '';
var actionsLikesCount = '';