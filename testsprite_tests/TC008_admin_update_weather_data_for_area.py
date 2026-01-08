import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:4200", wait_until="commit", timeout=10000)

        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass

        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass

        # Interact with the page elements to simulate user flow
 
        # -> Click on 'Login as Admin' to proceed with admin login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-home/section/div/div/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input admin email and password, then click login button.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/label/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin@firewatch.test')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/label[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('password')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Alerts' navigation link to go to alerts management page.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/header/nav/a[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Check if there is any pagination or load more button to reveal additional alerts from other users.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=FireWatch').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Home').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Maps').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Data').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Alerts').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Admin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=FireWatch AdminLogout').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Auto-generated Alerts').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Review alerts triggered by high-risk conditions.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=All Areas').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Latakia Highlands').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=All Risk Levels').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Low').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Medium').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=High').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=All Time').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Last 24 Hours').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Last 7 Days').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Latakia Highlands').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Auto alert: High risk detected in Latakia Highlands.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=high').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1/8/26, 1:59 AM').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=FireWatch - Forest fire monitoring and response.').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    