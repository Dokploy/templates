import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  //   CommandInputProps,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// import { HelperText } from "@/components/ui/helper-text";
import { Label } from "@/components/ui/label";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { LabelProps } from "@radix-ui/react-label";

type ComboboxTypes<T> = {
  labelKey?: keyof T | any;
  valueKey?: keyof T | any;
  data: T[];
  width?: string;
  texts?: {
    noItems?: string;
    placeholder?: string;
    searchPlaceholder?: string;
  };
  isLoading?: boolean;
  helperText?: any;
  popoverClassName?: string;
  /** This the same value as the one with the key valueKey */
  defaultValue?: string;
  preview?: boolean;
  hideInput?: boolean;
  direction?: "rtl" | "ltr";
  inputProps?: any;
  //   TODO: fix this
  //   inputProps?: CommandInputProps;
  id?: string;
  /** The label of the input field   */
  label?: any;
  labelProps?: LabelProps;
  /** If true, it will show a red asterisk next to the label*/
  isRequired?: boolean;
  onChange?: (e: any) => void;
  renderOption?: (item: T) => React.ReactNode;
  renderSelected?: (item: T) => React.ReactNode;
};
export const Combobox = React.forwardRef<HTMLDivElement, ComboboxTypes<any>>(
  (
    {
      labelKey = "label",
      valueKey = "value",
      defaultValue = "",
      popoverClassName,
      direction,
      labelProps,
      inputProps,
      data,
      renderOption,
      renderSelected,
      ...props
    },
    _
  ) => {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue);
    const containerRef = React.useRef<HTMLDivElement>(null);
    // function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    //   return key.split(".").reduce((o, k) => (o || {})[k], obj);
    // }

    function getProperty<T>(obj: T, key: string): any {
      return key.split(".").reduce((o: any, k: string) => (o || {})[k], obj);
    }

    const handleOpenChange = (open: boolean) => {
      if (!(props.isLoading || props.preview)) {
        setOpen(open);
      }
    };
    const selectedItem = data.find(
      (item) => getProperty(item, valueKey) === value
    );

    return (
      <div
        className={cn(
          "relative flex h-fit flex-col gap-2",
          props.width === "fit" ? "w-fit" : "w-full"
        )}
        ref={containerRef}
      >
        {props.label && <Label {...labelProps}>{props.label}</Label>}

        <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            {props.isLoading ? (
              <div className="pb-2">
                <Skeleton className="h-[40px] w-full" />
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <div
                  className={cn(
                    "absolute top-[22px] h-[0.8px] w-full bg-gray-200 transition-all dark:bg-gray-800",
                    props.preview ? "opacity-100" : "opacity-0"
                  )}
                ></div>
                <button
                  role="combobox"
                  type="button"
                  aria-expanded={open}
                  className={cn(
                    "inline-flex h-10 w-full select-none items-center justify-between rounded-md border py-2 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    props.preview
                      ? "cursor-default rounded-none border-transparent px-0"
                      : "bg-background px-3"
                  )}
                >
                  {selectedItem
                    ? renderSelected
                      ? renderSelected(selectedItem)
                      : getProperty(selectedItem, labelKey)
                    : props.texts?.placeholder || ". . ."}
                  {/* {value
                    ? getProperty(
                        data.find((item: any) => item[valueKey] === value) ||
                          {},
                        labelKey,
                      )
                    : props.texts?.placeholder || ". . ."} */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                      "size-4 transition-all",
                      !props.preview
                        ? "visible opacity-100"
                        : "invisible opacity-0"
                    )}
                    aria-label="Chevron down icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {/* <HelperText helperText={props.helperText} /> */}
              </div>
            )}
          </PopoverTrigger>
          <PopoverContent
            sideOffset={0}
            className={cn(
              "w-[--radix-popover-trigger-width] p-0",
              props.helperText && "-mt-4"
            )}
            dir={direction}
            // container={containerRef.current}
          >
            <Command
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase()))
                  return 1;
                return 0;
              }}
            >
              {!props.hideInput && (
                <CommandInput
                  {...inputProps}
                  dir={direction}
                  placeholder={props.texts?.searchPlaceholder || "Search"}
                />
              )}
              <CommandEmpty>
                {props.texts?.noItems || "No items found."}
              </CommandEmpty>
              <CommandList>
                <CommandGroup
                  className={cn(
                    "max-h-[200px]",
                    data.length > 0 && "overflow-y-auto"
                  )}
                >
                  {data.map((item: any, i) => (
                    <CommandItem
                      key={i}
                      onSelect={() => {
                        const newValue = getProperty(item, valueKey);
                        setValue(
                          newValue === value ? "" : (newValue as string)
                        );
                        if (props.onChange) {
                          props.onChange(
                            newValue === value ? "" : (newValue as string)
                          );
                        }
                        setOpen(false);
                      }}
                    >
                      <svg
                        aria-label="Check Icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          "icon",
                          value === getProperty(item, valueKey)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                        style={{ marginInlineEnd: "0.5rem" }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {renderOption
                        ? renderOption(item)
                        : getProperty(item, labelKey)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
