import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { CodeEditor } from "./ui/code-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Clipboard } from "lucide-react";
import { Input } from "./ui/input";

interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  logo?: string;
  links: {
    github?: string;
    website?: string;
    docs?: string;
  };
  tags: string[];
}

interface TemplateFiles {
  dockerCompose: string | null;
  config: string | null;
}

interface TemplateDialogProps {
  selectedTemplate: Template | null;
  templateFiles: TemplateFiles | null;
  modalLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  selectedTemplate,
  templateFiles,
  modalLoading,
  onOpenChange,
}) => {
  const getBase64Config = () => {
    if (!templateFiles?.dockerCompose && !templateFiles?.config) return "";

    const configObj = {
      compose: templateFiles.dockerCompose || "",
      config: templateFiles.config || "",
    };

    // Use encodeURIComponent to handle Unicode characters properly
    const jsonString = JSON.stringify(configObj, null, 2);
    return btoa(unescape(encodeURIComponent(jsonString)));
  };

  return (
    <Dialog open={!!selectedTemplate} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col !max-w-[90vw] w-full lg:max-w-[90vw] max-h-[85vh] p-0">
        <DialogHeader className="space-y-4 border-b sticky top-0 p-4 pb-0 text-start bg-background rounded-t-lg z-10">
          <div className="flex items-center gap-4">
            {selectedTemplate?.logo && (
              <img
                src={`/blueprints/${selectedTemplate.id}/${selectedTemplate.logo}`}
                alt={selectedTemplate.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <div className="min-w-0">
              <DialogTitle className="text-2xl truncate">
                {selectedTemplate?.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-500">
                  {selectedTemplate?.version}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {selectedTemplate?.links.github && (
                    <a
                      href={selectedTemplate.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      GitHub
                    </a>
                  )}
                  {selectedTemplate?.links.docs && (
                    <a
                      href={selectedTemplate.links.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Docs
                    </a>
                  )}
                  <a
                    href={`https://github.com/Dokploy/templates/tree/main/blueprints/${selectedTemplate?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Edit Template
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pt-3 space-y-6">
            <div className="space-y-2">
              <DialogDescription className="text-base">
                {selectedTemplate?.description}
              </DialogDescription>
              <div className="flex flex-wrap gap-1">
                {selectedTemplate?.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {modalLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading template files...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(templateFiles?.dockerCompose || templateFiles?.config) && (
                  <div className="flex flex-col gap-3">
                    <Label className="flex flex-col items-start w-fit justify-start gap-1">
                      <span className="leading-tight text-xl font-semibold">
                        Base64 Configuration
                      </span>
                      <span className="leading-tight text-sm text-gray-500">
                        Encoded template file
                      </span>
                    </Label>
                    <div className="relative w-full">
                      <Button
                        className="absolute end-0 top-1/2 -translate-y-1/2"
                        size={"icon"}
                        onClick={() => {
                          toast.success("Copied to clipboard");
                          copy(getBase64Config());
                        }}
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                      <Input
                        value={getBase64Config()}
                        className="w-full pr-10"
                        readOnly
                      />
                    </div>
                  </div>
                )}
                <Tabs defaultValue="docker-compose" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger
                      value="docker-compose"
                      className="data-[state=active]:font-bold"
                    >
                      Docker Compose
                    </TabsTrigger>
                    <TabsTrigger
                      value="config"
                      className="data-[state=active]:font-bold"
                    >
                      Configuration
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="docker-compose" className="mt-4">
                    {templateFiles?.dockerCompose && (
                      <div className="space-y-2">
                        <Label className="flex flex-col items-start w-fit justify-start gap-1">
                          <span className="leading-tight text-xl font-semibold">
                            Docker Compose
                          </span>
                          <span className="leading-tight text-sm text-gray-500">
                            docker-compose.yml
                          </span>
                        </Label>
                        <div className="relative w-full rounded-md overflow-hidden border">
                          <CodeEditor
                            value={templateFiles.dockerCompose || ""}
                            language="yaml"
                            className="font-mono w-full [&_*]:!break-words"
                          />
                          <Button
                            onClick={() => {
                              toast.success("Copied to clipboard");
                              copy(templateFiles.dockerCompose || "");
                            }}
                            className="absolute top-2 right-2 px-3 py-1 text-sm"
                            variant="secondary"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="config" className="mt-4">
                    {templateFiles?.config && (
                      <div className="space-y-2">
                        <Label className="flex flex-col items-start w-fit justify-start gap-1">
                          <span className="leading-tight text-xl font-semibold">
                            Configuration
                          </span>
                          <span className="leading-tight text-sm text-gray-500">
                            template.yml
                          </span>
                        </Label>
                        <div className="relative w-full rounded-md overflow-hidden border">
                          <CodeEditor
                            value={templateFiles.config || ""}
                            language="toml"
                            className="font-mono w-full [&_*]:!break-words"
                          />
                          <Button
                            onClick={() => {
                              toast.success("Copied to clipboard");
                              copy(templateFiles.config || "");
                            }}
                            className="absolute top-2 right-2 px-3 py-1 text-sm"
                            variant="secondary"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {!templateFiles?.dockerCompose && !templateFiles?.config && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No configuration files available for this template.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
