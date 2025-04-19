import React, { useState } from "react";
import { Input, Button, message } from "antd";
import dayjs from "dayjs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/notificationPage.scss";

// Define interfaces for TypeScript
interface NotificationData {
    eventName: string;
    text: string;
}

const Notification: React.FC = () => {
    const [eventName, setEventName] = useState<string>("");
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    // Function to convert editor HTML to full HTML document
    const convertTextToHtml = (editorHtml: string, eventName: string): string => {
        // Clean up editor HTML but preserve formatting and structure
        let cleanedHtml = editorHtml
            .replace(/<p>\s*<\/p>/g, "") // Remove empty <p> tags
            .replace(/<p><br\s*\/?><\/p>/g, "") // Remove <p> with just <br>
            // Ensure nested ordered lists use lower-alpha explicitly
            .replace(/<ol type="a"/g, '<ol style="list-style-type: lower-alpha;"')
            // Convert react-quill alignment classes to inline styles for Gmail compatibility
            .replace(/class="ql-align-center"/g, 'style="text-align: center;"')
            .replace(/class="ql-align-right"/g, 'style="text-align: right;"')
            .replace(/class="ql-align-justify"/g, 'style="text-align: justify;"')
            .replace(/class="ql-align-left"/g, 'style="text-align: left;"')
            .trim();

        // Additional fix for nested lists: Ensure nested <ol> is properly indented
        cleanedHtml = cleanedHtml.replace(/(<li>.*?)(\s*<ol\b[^>]*>)/g, '$1<div class="nested-list">$2</div>');

        const htmlLines = [
            '<!DOCTYPE html>',
            '<html lang="vi">',
            '<head>',
            '    <meta charset="UTF-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            `    <title>${eventName || "Notification"}</title>`,
            '    <style>',
            '        body {',
            '            font-family: Arial, sans-serif;',
            '            background: #f5f7fa;',
            '            color: #333;',
            '            padding: 20px;',
            '            margin: 0;',
            '        }',
            '        .container {',
            '            background: #fff;',
            '            max-width: 600px;',
            '            margin: 0 auto;',
            '            border-radius: 8px;',
            '            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);',
            '            padding: 30px;',
            '        }',
            '        h1 {',
            '            color: #f7931a;',
            '            font-size: 24px;',
            '            margin-bottom: 20px;',
            '            text-align: center;',
            '        }',
            '        .content {',
            '            font-size: 16px;',
            '            line-height: 1.6;',
            '            margin-bottom: 20px;',
            '            text-align: left;',
            '        }',
            '        .content p {',
            '            margin: 0 0 10px 0;',
            '        }',
            '        .content strong {',
            '            font-weight: bold;',
            '        }',
            '        .content em {',
            '            font-style: italic;',
            '        }',
            '        .content u {',
            '            text-decoration: underline;',
            '        }',
            '        .content ol, .content ul {',
            '            margin: 0 0 10px 0;',
            '            padding: 0;',
            '            list-style-position: inside;', // Đưa số/chữ cái vào trong vùng nội dung
            '        }',
            '        .content ol li, .content ul li {',
            '            margin: 0 0 5px 0;',
            '            text-align: inherit;', // Đảm bảo text-align của li thừa hưởng từ cha
            '        }',
            '        .content ol ol, .content ul ul {',
            '            margin: 0 0 10px 20px;', // Thụt lề 20px cho danh sách lồng nhau
            '            padding: 0;',
            '            list-style-position: inside;', // Áp dụng list-style-position: inside cho danh sách lồng nhau
            '        }',
            '        .nested-list {',
            '            margin-left: 20px;', // Thêm thụt lề cho danh sách lồng nhau
            '        }',
            '        .date {',
            '            font-size: 18px;',
            '            color: #555;',
            '            margin: 20px 0;',
            '            text-align: center;',
            '        }',
            '        .btn {',
            '            display: inline-block;',
            '            background: #f7931a;',
            '            color: white;',
            '            padding: 12px 20px;',
            '            text-decoration: none;',
            '            border-radius: 6px;',
            '            font-weight: bold;',
            '            text-align: center;',
            '        }',
            '        .btn:hover {',
            '            background: #e28114;',
            '        }',
            '    </style>',
            '</head>',
            '<body>',
            '    <div class="container">',
            `        <div class="content">${cleanedHtml || "<p>No content provided.</p>"}</div>`,
            '    </div>',
            '</body>',
            '</html>',
        ];

        return htmlLines.join("\n");
    };

    // Handle form submission
    const handleSubmit = async (): Promise<void> => {
        if (!eventName.trim() || !text.trim()) {
            message.error("Please fill in both event name and content.");
            return;
        }

        setLoading(true);
        try {
            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("JWT token not found in localStorage");
            }

            // Convert editor HTML to full HTML document
            const htmlText = convertTextToHtml(text, eventName);

            const response = await fetch("http://localhost:5000/api/users/admin/send-notification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    eventName,
                    text: htmlText,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send notification: ${response.status} ${errorText}`);
            }

            const data: { message?: string } = await response.json();
            message.success(data.message || "Notification sent successfully!");
            // Reset form
            setEventName("");
            setText("");
        } catch (error) {
            console.error("Error sending notification:", error);
            message.error((error as Error).message || "Error sending notification");
        } finally {
            setLoading(false);
        }
    };

    // React Quill toolbar configuration
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            [{ align: [] }],
            ["clean"],
        ],
    };

    return (
        <div className="notification-page">
            <div className="notification-card">
                <h1 className="notification-title">Send Notification</h1>
                <div className="form-group">
                    <label className="form-label">Event Name</label>
                    <Input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Enter event name"
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Content</label>
                    <ReactQuill
                        value={text}
                        onChange={setText}
                        modules={quillModules}
                        placeholder="Enter notification content..."
                        className="form-quill"
                    />
                </div>
                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    className="form-button"
                >
                    Send Notification
                </Button>
            </div>
        </div>
    );
};

export default Notification;