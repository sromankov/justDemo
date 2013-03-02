<script type="text/javascript">
    name = '{$blockName}-{$parentType}-{$parentId}-form';
    formCount = $("[name ='CF_common']").size();
    if (formCount > 1) {
        $("#"+name).html('');
        $("[name ='CF_common']").hide();
    }
</script>

<!-- COMMENTS BLOCK {$blockName}-{$parentType}-{$parentId} START -->
<div class="comments-block-wrapper">
    <div class="comments-block">
        <div id="{$blockName}-{$parentType}-{$parentId}-form">
        {if !empty($commentForm)}
            {Forms_CommentForm('CF_form')}
        {/if}
        </div>
        <div id="{$blockName}-{$parentType}-{$parentId}-children">
            <div id="{$blockName}-{$parentType}-{$parentId}-append"></div>
        </div>
    </div>
</div>
<!-- COMMENTS BLOCK {$blockName}-{$parentType}-{$parentId} END -->

<!-- COMMENTS BLOCK {$blockName} INI START -->
<script type="text/javascript">
    $(function() {
    // one comment form for all blocks
        if (typeof CF_form == 'undefined')
        {
            CF_form = new commentsForm('CF_common', false);

        }

        // new comment instance for this block
        CI_{$blockName} = new commentsInstance('{$parentType}', '{$parentId}', '{$blockName}');

        CB_{$blockName} = new commentsBlock(CI_{$blockName}, CF_form);

        CS_{$blockName} = new commentsStat(CI_{$blockName});

        // new like instance
        LI_{$blockName} = new LikesInstance('{$parentType}', '{$parentId}', '{$blockName}');
        LS_{$blockName} = new LikesStat(LI_{$blockName});
    });
</script>
<!-- COMMENTS BLOCK {$blockName} INI END -->