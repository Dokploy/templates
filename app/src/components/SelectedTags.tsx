import { XIcon } from "lucide-react";
import { useStore } from "@/store";
import { Badge } from "./ui/badge";

const SelectedTags = () => {
  const selectedTags = useStore((state) => state.selectedTags);
  const removeSelectedTag = useStore((state) => state.removeSelectedTag);

  return (
    <div className="flex flex-wrap gap-2 mt-4 border-t pt-4">
      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="default"
          className="cursor-pointer pr-1 flex items-center gap-1"
        >
          {tag}
          <div
            className="hover:bg-primary-foreground/20 rounded-full p-1"
            onClick={() => removeSelectedTag(tag)}
          >
            <XIcon className="h-3 w-3" />
          </div>
        </Badge>
      ))}
    </div>
  );
};

export default SelectedTags;
