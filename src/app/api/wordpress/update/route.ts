import { NextResponse } from "next/server";
import { 
  searchWordPressPost, 
  updateWordPressPost, 
  generateEpisodeCode,
  findMatchingPost,
  updatePostContent,
  updatePostTitle
} from "@/lib/wordpress";

export async function POST(request: Request) {
  try {
    const { fileName, webContentLink, searchTitle } = await request.json();
    console.log("📥 Received request with:", { fileName, searchTitle });

    if (!fileName || !webContentLink || !searchTitle) {
      console.log("❌ Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Search for WordPress posts
    const posts = await searchWordPressPost(searchTitle);
    if (posts.length === 0) {
      console.log("❌ No posts found for search term:", searchTitle);
      return NextResponse.json(
        { error: "No posts found matching the search term" },
        { status: 404 }
      );
    }

    // Find the post that matches the episode
    const matchingPost = findMatchingPost(posts, fileName);
    if (!matchingPost) {
      console.log("❌ No matching post found for episode in file:", fileName);
      return NextResponse.json(
        { error: "No matching post found for this episode" },
        { status: 404 }
      );
    }

    // Generate the episode code
    const episodeCode = generateEpisodeCode(fileName, webContentLink);
    console.log("📝 Generated episode code:", episodeCode);

    // Check if the episode code already exists in the post
    if (matchingPost.content.rendered.includes(episodeCode)) {
      console.log("⚠️ Episode code already exists in post");
      return NextResponse.json(
        { error: "Episode code already exists in the post" },
        { status: 400 }
      );
    }

    // Update the post content and title
    const updatedContent = updatePostContent(matchingPost.content.rendered, episodeCode);
    const updatedTitle = updatePostTitle(matchingPost.title.rendered, fileName);
    
    console.log("🔄 Updating post with new episode code and title");
    const success = await updateWordPressPost(
      matchingPost.id,
      updatedContent,
      updatedTitle
    );

    if (!success) {
      console.log("❌ Failed to update post");
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    console.log("✅ Successfully updated post:", updatedTitle);
    return NextResponse.json({ 
      success: true,
      postId: matchingPost.id,
      postTitle: updatedTitle
    });
  } catch (error) {
    console.error("❌ Error in WordPress update endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 