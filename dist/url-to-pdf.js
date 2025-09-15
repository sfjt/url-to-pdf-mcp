import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium } from "playwright";
const server = new McpServer({
    name: "url-to-pdf",
    version: "1.0.0"
});
async function urlToPDF(url) {
    const filename = `${Date.now()}.pdf`;
    const absPath = resolve(join("./files", filename));
    const browser = await chromium.launch({ headless: true });
    let result;
    try {
        const page = await browser.newPage();
        await page.goto(url);
        await page.pdf({
            path: absPath,
            format: "A4"
        });
        result = {
            uri: pathToFileURL(absPath).toString(),
            filename
        };
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await browser.close();
    }
    return result;
}
server.registerTool("url-to-pdf", {
    title: "URL to PDF",
    description: "Save the specified web page as a PDF file",
    inputSchema: { url: z.string() }
}, async ({ url }) => {
    const pdf = await urlToPDF(url);
    if (!pdf) {
        return {
            content: [
                { type: "text", text: "ERROR: Failed to save the webpage as a PDF file" },
            ]
        };
    }
    return {
        content: [
            { type: "text", text: "SUCCESS: Sccessfully saved the webpage as a PDF file." },
            {
                type: "resource_link",
                uri: pdf.uri,
                mimeType: "application/pdf",
                name: pdf.filename,
                description: `Saved as a PDF file: ${url}`
            }
        ]
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
