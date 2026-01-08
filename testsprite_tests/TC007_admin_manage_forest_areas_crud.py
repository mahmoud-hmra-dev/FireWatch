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
 
        # -> Click on 'Login as User' to proceed to user login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-home/section/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click login button.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/label/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin@firewatch.test')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/label[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('password')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-login/section/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Alerts' navigation link to go to the alerts page.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/header/nav/a[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Check if there is a filter or option to view only the logged-in user's submitted alerts or any user-specific filter.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-alerts/div/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Attempt to submit a new alert as the logged-in user to verify if it appears correctly in the alerts list.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/header/nav/a[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill in the manual alert form with test data and submit the alert.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/label[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('34.0500')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/label[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('-118.2500')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/label[4]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test fire alert for user verification')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Upload a photo file to the photo evidence input field using the file upload function, then resubmit the alert form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Upload a photo file to the photo evidence input field using the file upload function, then resubmit the alert form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Upload a photo file to the photo evidence input field using the file upload function, then resubmit the alert form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/app-root/div/main/app-admin-dashboard/section[3]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=All Users Fire Alerts Overview').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test case failed: The test plan requires verifying that only the user's own fire alerts are shown with correct details. This assertion fails immediately to indicate the test plan execution failure.")
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    