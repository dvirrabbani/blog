This post exists to show what images look like here, so the layout has something real to hold.

The image above is the **cover**. It comes from the *Cover image* field on the post form, and it shows up in three places: the top of this page, the card for this post on the home page, and the preview card when someone shares the link.

## Images inside the text

Anything added with the **Image** button in the toolbar lands wherever the cursor was, like this one:

![An open notebook with a pen resting across it](/uploads/example-desk.jpg)

Both go through the same crop dialog before uploading. Covers default to 16:9 because that's the shape the home page expects; inline images start free-form, since a portrait photo or a square screenshot is often exactly right in the middle of a paragraph.

## A few things worth knowing

1. The crop is applied before the file leaves the browser — only the visible region is uploaded.
2. Wide images are scaled down to 2000px, so a photo straight off a camera doesn't become a 12MB download.
3. Alt text comes from the words between the brackets. It's worth replacing the default with a real description.

> Images are the one thing on a page that can't be skimmed. Worth being deliberate about which ones earn their place.

The rest of the formatting still works around them — `inline code`, [links](https://nextjs.org), lists, and quotes all sit alongside images without any special handling.
