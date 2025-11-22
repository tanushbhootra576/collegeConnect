import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";

// Helper to extract Drive ID
function getDriveId(url: string): string | null {
    // Simple regex to find a long string of characters that looks like a Drive ID
    // Drive IDs are usually alphanumeric with some special chars, around 33 chars long
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}

export async function GET() {
  try {
    await dbConnect();
    const apiKey = process.env.GOOGLE_API_KEY;

    // 1. Fetch resources from MongoDB that look like Drive links
    const resources = await Resource.find({
        linkUrl: { $regex: 'drive.google.com', $options: 'i' }
    }).lean();

    // 2. If no resources in DB and no API key, return Demo data (fallback)
    if (resources.length === 0 && !apiKey) {
      // DEMO fallback
      const demo = [
        {
          id: "demo-folder-1",
          name: "DEMO - Advanced Competitive Programming",
          mimeType: "application/vnd.google-apps.folder",
          children: [
            {
              id: "demo-file-1",
              name: "Sample Image (screenshot).png",
              mimeType: "image/png",
              url: "https://placehold.co/600x400/png"
            },
            {
              id: "demo-file-2",
              name: "Sample PDF (link)",
              mimeType: "application/pdf",
              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            }
          ]
        },
        {
          id: "demo-folder-2",
          name: "DEMO - COMPUTER NETWORKS",
          mimeType: "application/vnd.google-apps.folder",
          children: []
        }
      ];

      return NextResponse.json({ ok: true, items: demo });
    }

    // 3. Map MongoDB resources to Drive Folder structures
    const items = await Promise.all(resources.map(async (res: any) => {
        const url = res.linkUrl || "";
        const id = getDriveId(url);
        const name = res.title; // Use the title from MongoDB

        // If we have an API Key and a valid ID, try to fetch children from Drive
        if (apiKey && id) {
            try {
                // Fetch children of this folder
                const childrenRes = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q='${id}'+in+parents&fields=files(id,name,mimeType,webViewLink,thumbnailLink,iconLink,createdTime,modifiedTime,size)&key=${apiKey}`
                );
                
                if (childrenRes.ok) {
                    const childrenData = await childrenRes.json();
                    return {
                        id: id,
                        name: name,
                        mimeType: "application/vnd.google-apps.folder",
                        webViewLink: url,
                        children: childrenData.files || []
                    };
                }
            } catch (err) {
                console.error(`Error fetching drive data for ${name}:`, err);
            }
        }

        // Fallback: Return folder without children (or if API key missing)
        return {
            id: id || res._id.toString(),
            name: name,
            mimeType: "application/vnd.google-apps.folder",
            webViewLink: url,
            children: []
        };
    }));

    return NextResponse.json({ ok: true, items });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
