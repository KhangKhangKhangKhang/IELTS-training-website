"use client";
import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Heading1,
    Heading2,
    Heading3,
    Type,
    Palette,
    RotateCcw,
    RotateCw,
    RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RichTextEditor = ({
    value = "",
    onChange,
    placeholder = "Nhập nội dung...",
    className = "",
    minHeight = "200px",
}) => {
    const editorRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    // Set initial content
    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML && value) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        // For fontSize, manually wrap the selection
        if (command === "fontSize") {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();

                if (selectedText) {
                    // Create font element with size
                    const fontEl = document.createElement("font");
                    fontEl.size = value;

                    // Extract contents and wrap
                    const contents = range.extractContents();
                    fontEl.appendChild(contents);
                    range.insertNode(fontEl);

                    // Restore selection
                    editorRef.current?.focus();
                    handleInput();
                    return;
                }
            }
        }

        // For color commands and others, use standard execCommand
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        handleInput();
    };

    const ToolbarButton = ({ onClick, icon: Icon, title, active = false }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            onMouseDown={(e) => e.preventDefault()}
            title={title}
            className={cn(
                "h-8 w-8 p-0 transition-colors",
                active
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            )}
        >
            <Icon size={16} />
        </Button>
    );

    const ColorPicker = ({ type = "foreColor" }) => {
        const inputRef = useRef(null);
        const savedRange = useRef(null);

        const handleColorClick = (e) => {
            e.preventDefault();
            // Save current selection before opening color picker
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                savedRange.current = selection.getRangeAt(0);
            }
            inputRef.current?.click();
        };

        const handleColorChange = (e) => {
            const color = e.target.value;

            // Focus editor and restore selection
            if (savedRange.current && editorRef.current) {
                editorRef.current.focus();

                // Small delay to ensure focus is complete
                setTimeout(() => {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(savedRange.current);

                    // Execute color command
                    execCommand(type, color);
                }, 10);
            } else {
                execCommand(type, color);
            }
        };

        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type="color"
                    className="absolute opacity-0 w-0 h-0"
                    onChange={handleColorChange}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleColorClick}
                    onMouseDown={(e) => e.preventDefault()}
                    title={type === "foreColor" ? "Màu chữ" : "Màu nền"}
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                >
                    <Palette size={16} />
                </Button>
            </div>
        );
    };

    const FontSizeButton = () => {
        const sizes = [
            { label: "Nhỏ", value: "2" },
            { label: "Bình thường", value: "3" },
            { label: "Lớn", value: "5" },
            { label: "Rất lớn", value: "7" },
        ];

        const handleSizeChange = (e) => {
            const size = e.target.value;
            if (size && size !== "default") {
                // Focus editor first
                editorRef.current?.focus();

                // Execute command with small delay
                setTimeout(() => {
                    execCommand("fontSize", size);

                    // Reset select to default
                    e.target.value = "default";
                }, 10);
            }
        };

        return (
            <select
                onChange={handleSizeChange}
                onMouseDown={(e) => e.preventDefault()}
                defaultValue="default"
                className="h-8 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="default">Kích thước</option>
                {sizes.map((size) => (
                    <option key={size.value} value={size.value}>
                        {size.label}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div
            className={cn(
                "border rounded-lg overflow-hidden transition-all",
                isFocused
                    ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 dark:border-slate-600",
                className
            )}
        >
            {/* Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <div className="flex gap-1 pr-2 border-r border-slate-300 dark:border-slate-600">
                    <ToolbarButton
                        onClick={() => execCommand("bold")}
                        icon={Bold}
                        title="In đậm (Ctrl+B)"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("italic")}
                        icon={Italic}
                        title="In nghiêng (Ctrl+I)"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("underline")}
                        icon={Underline}
                        title="Gạch chân (Ctrl+U)"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("strikeThrough")}
                        icon={Strikethrough}
                        title="Gạch ngang"
                    />
                </div>

                {/* Headings */}
                <div className="flex gap-1 pr-2 border-r border-slate-300 dark:border-slate-600">
                    <ToolbarButton
                        onClick={() => execCommand("formatBlock", "<h1>")}
                        icon={Heading1}
                        title="Tiêu đề 1"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("formatBlock", "<h2>")}
                        icon={Heading2}
                        title="Tiêu đề 2"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("formatBlock", "<h3>")}
                        icon={Heading3}
                        title="Tiêu đề 3"
                    />
                </div>

                {/* Lists */}
                <div className="flex gap-1 pr-2 border-r border-slate-300 dark:border-slate-600">
                    <ToolbarButton
                        onClick={() => execCommand("insertUnorderedList")}
                        icon={List}
                        title="Danh sách"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("insertOrderedList")}
                        icon={ListOrdered}
                        title="Danh sách số"
                    />
                </div>

                {/* Alignment */}
                <div className="flex gap-1 pr-2 border-r border-slate-300 dark:border-slate-600">
                    <ToolbarButton
                        onClick={() => execCommand("justifyLeft")}
                        icon={AlignLeft}
                        title="Căn trái"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("justifyCenter")}
                        icon={AlignCenter}
                        title="Căn giữa"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("justifyRight")}
                        icon={AlignRight}
                        title="Căn phải"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("justifyFull")}
                        icon={AlignJustify}
                        title="Căn đều"
                    />
                </div>

                {/* Font Size & Colors */}
                <div className="flex gap-1 pr-2 border-r border-slate-300 dark:border-slate-600">
                    <FontSizeButton />
                    <ColorPicker type="foreColor" />
                </div>

                {/* Undo/Redo & Clear */}
                <div className="flex gap-1">
                    <ToolbarButton
                        onClick={() => execCommand("undo")}
                        icon={RotateCcw}
                        title="Hoàn tác (Ctrl+Z)"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("redo")}
                        icon={RotateCw}
                        title="Làm lại (Ctrl+Y)"
                    />
                    <ToolbarButton
                        onClick={() => execCommand("removeFormat")}
                        icon={RemoveFormatting}
                        title="Xóa định dạng"
                    />
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                    "p-4 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 overflow-y-auto",
                    "prose dark:prose-invert max-w-none",
                    "prose-headings:mt-2 prose-headings:mb-2",
                    "prose-p:my-1",
                    "prose-ul:my-1 prose-ol:my-1",
                    "[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-slate-400 [&:empty:before]:dark:text-slate-500"
                )}
                style={{ minHeight }}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
        </div>
    );
};

export default RichTextEditor;
