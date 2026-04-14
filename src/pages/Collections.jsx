import CollectionPage from "../components/ui/CollectionPage";
import { FileText, Images, Film, Mic, MessageCircle } from "lucide-react";

export function Blogs() {
  return (
    <CollectionPage
      collectionName="blogs"
      title="Blogs"
      icon={FileText}
      color="#6b7c2c"
      fields={[
        { key: "sno", label: "S.No", type: "text" },
        { key: "date", label: "Date", type: "date" },
        { key: "title", label: "Title", span: 2 },
        { key: "prompt", label: "Prompt", type: "textarea", span: 2 },
        { key: "imagePrompt", label: "Image Prompt", type: "textarea", span: 2 },
        { key: "caption", label: "Caption", type: "textarea", span: 2 },
        { key: "tags", label: "Tags" },
        { key: "adsCaption", label: "Ads Caption", type: "textarea", span: 2 },
        { key: "status", label: "Status", type: "select" },
      ]}
      platforms={["wix", "linkedin", "facebook", "twitter", "threads", "pinterest", "youtube"]}
      tableColumns={[
        { key: "date", label: "Date" },
        { key: "title", label: "Title" },
        { key: "tags", label: "Tags" },
      ]}
    />
  );
}

export function Carousels() {
  return (
    <CollectionPage
      collectionName="carousels"
      title="Carousels"
      icon={Images}
      color="#3b82f6"
      fields={[
        { key: "sno", label: "S.No" },
        { key: "date", label: "Date", type: "date" },
        { key: "title", label: "Title", span: 2 },
        { key: "prompt", label: "Prompt", type: "textarea", span: 2 },
        { key: "caption", label: "Caption", type: "textarea", span: 2 },
        { key: "tags", label: "Tags" },
        { key: "status", label: "Status", type: "select" },
      ]}
      platforms={["instagram", "facebook", "linkedin", "youtube"]}
      tableColumns={[
        { key: "date", label: "Date" },
        { key: "title", label: "Title" },
        { key: "tags", label: "Tags" },
      ]}
    />
  );
}

export function Reels() {
  return (
    <CollectionPage
      collectionName="reels"
      title="Reels"
      icon={Film}
      color="#8b5cf6"
      fields={[
        { key: "sno", label: "S.No" },
        { key: "date", label: "Date", type: "date" },
        { key: "title", label: "Title", span: 2 },
        { key: "imagePrompt1", label: "Image Prompt 1", type: "textarea" },
        { key: "imagePrompt2", label: "Image Prompt 2", type: "textarea" },
        { key: "imagePrompt3", label: "Image Prompt 3", type: "textarea" },
        { key: "imagePrompt4", label: "Image Prompt 4", type: "textarea" },
        { key: "videoPrompt", label: "Video Prompt", type: "textarea", span: 2 },
        { key: "captionTags", label: "Caption / Tags", type: "textarea", span: 2 },
        { key: "status", label: "Status", type: "select" },
      ]}
      platforms={["instagram", "facebook", "linkedin", "youtube", "pinterest"]}
      tableColumns={[
        { key: "date", label: "Date" },
        { key: "title", label: "Title" },
        { key: "captionTags", label: "Caption/Tags" },
      ]}
    />
  );
}

export function Media() {
  return (
    <CollectionPage
      collectionName="media"
      title="Podcast / YouTube"
      icon={Mic}
      color="#ec4899"
      fields={[
        { key: "sno", label: "S.No" },
        { key: "title", label: "Title", span: 2 },
        { key: "promptImage", label: "Prompt / Image", type: "textarea", span: 2 },
        { key: "captionTitleTags", label: "Caption / Title / Tags", type: "textarea", span: 2 },
        { key: "description", label: "Description", type: "textarea", span: 2 },
        { key: "status", label: "Status", type: "select" },
      ]}
      platforms={["youtube", "podcast", "socialCaption", "linkedin", "twitter", "threads"]}
      tableColumns={[
        { key: "title", label: "Title" },
        { key: "captionTitleTags", label: "Caption/Tags" },
      ]}
    />
  );
}

export function Tweets() {
  return (
    <CollectionPage
      collectionName="tweets"
      title="Tweets"
      icon={MessageCircle}
      color="#0ea5e9"
      fields={[
        { key: "sno", label: "S.No" },
        { key: "date", label: "Date", type: "date" },
        { key: "tweet", label: "Tweet", type: "textarea", span: 2 },
        { key: "tags", label: "Tags" },
        { key: "status", label: "Status", type: "select" },
      ]}
      platforms={["response"]}
      tableColumns={[
        { key: "date", label: "Date" },
        { key: "tweet", label: "Tweet" },
        { key: "tags", label: "Tags" },
      ]}
    />
  );
}
