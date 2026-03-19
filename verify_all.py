import asyncio
from playwright.async_api import async_playwright
import time

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # 1. Verify Home Screen
        print("Verifying Home Screen...")
        await page.goto('http://localhost:1420')
        await page.wait_for_selector('text=Hachiai')
        await page.screenshot(path='home_v4.png')

        # 2. Navigate to Editor (Click the mock recording)
        print("Navigating to Editor...")
        # Use the text from the mock recording card
        await page.click('text=Checkout Process v1')

        # Wait for Editor to load - using h3 instead of h2
        await page.wait_for_selector('h3:has-text("Workflow Steps")')
        await page.screenshot(path='editor_v4.png')

        # 3. Verify Annotation Canvas
        print("Verifying Annotation Canvas...")
        # Click "Add Highlight"
        await page.click('text=Add Highlight')
        # Click "Add Blur"
        await page.click('text=Add Blur')

        # Wait a bit for Konva to render
        await asyncio.sleep(1)
        await page.screenshot(path='annotation_v4.png')

        # 4. Test Export (just click and see if it doesn't crash)
        print("Testing Export button click...")
        await page.click('text=Export Document')

        await browser.close()
        print("Verification complete. Screenshots saved.")

if __name__ == "__main__":
    asyncio.run(verify())
