import { test, expect, Page } from '@playwright/test'

// Run tests sequentially since they share user state
test.describe.configure({ mode: 'serial' })

const TEST_USER = {
  email: 'user1@test.fr',
  password: 'user1',
}

async function login(page: Page) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Mot de passe').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Valider' }).click()
  // Wait for redirect after login (app redirects to /profil)
  await page.waitForURL('/profil')
}

async function clearUserFavorites(page: Page) {
  // Navigate to profile and clear any existing favorites
  await page.goto('/profil')
  await page.getByRole('tab', { name: 'Mes favoris' }).click()

  // Wait for favorites to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Click all filled hearts to unfavorite
  let attempts = 0
  while (attempts < 10) {
    const filledHeart = page.getByTestId('favorite-button-filled').first()
    const isVisible = await filledHeart
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (!isVisible) {
      break
    }
    await filledHeart.click()
    // Wait for mutation to complete
    await page.waitForTimeout(1000)
    attempts++
  }
}

test.describe('Favorites Feature', () => {
  test.describe('Toggle Favorite', () => {
    test('should toggle favorite from activity card on homepage', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Find the first activity card's favorite button (outlined heart)
      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()

      // Click to favorite
      await outlinedHeart.click()

      // Verify heart is now filled
      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await expect(filledHeart).toBeVisible()

      // Verify toast notification
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    })

    test('should toggle favorite from activity detail page', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Click "Voir plus" button inside the first activity card (not the section button)
      // The cards use Mantine Button variant="light", section uses variant="outline"
      await page.locator('[class*="Card"]').first().getByRole('link', { name: 'Voir plus' }).click()
      await page.waitForURL(/\/activities\//)

      // Find the favorite button (should be outlined since we cleared favorites)
      // Use first() since there might be other favorite buttons for related activities
      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()

      // Wait for element to be stable before clicking
      await page.waitForTimeout(500)
      // Click to favorite - need to re-locate due to React re-renders
      await page.getByTestId('favorite-button-outlined').first().click()

      // Verify heart is now filled
      await expect(page.getByTestId('favorite-button-filled').first()).toBeVisible()

      // Verify toast notification
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    })
  })

  test.describe('State Consistency', () => {
    test('should maintain favorite state across pages', async ({ page }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Get the first activity's "Voir plus" link to track which activity we're favoriting
      // Use card-scoped selector to avoid getting the section button
      const firstCard = page.locator('[class*="Card"]').first()
      const firstActivityLink = firstCard.getByRole('link', { name: 'Voir plus' })

      // Click the heart on homepage
      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await outlinedHeart.click()
      await expect(page.getByTestId('favorite-button-filled').first()).toBeVisible()

      // Wait for mutation to complete
      await page.waitForTimeout(500)

      // Navigate to detail page by clicking the link
      await firstActivityLink.click()
      await page.waitForURL(/\/activities\//)

      // Verify the heart is filled on detail page
      await expect(page.getByTestId('favorite-button-filled')).toBeVisible()
    })
  })

  test.describe('Unauthenticated User', () => {
    test('should redirect to signin when clicking favorite without login', async ({
      page,
    }) => {
      await page.goto('/')

      // Find and click the first favorite button
      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()
      await outlinedHeart.click()

      // Verify redirect to signin
      await page.waitForURL('/signin')
      await expect(page.getByRole('heading', { name: 'Connection' })).toBeVisible()
    })
  })

  test.describe('Profile Favorites Tab', () => {
    test('should display favorited activities in profile tab', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Favorite 2 activities
      const outlinedHearts = page.getByTestId('favorite-button-outlined')

      // Favorite first activity
      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      // Favorite second activity
      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()

      // Navigate to profile
      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      // Verify both activities are listed
      const favoriteCards = page.locator('[class*="Card"]').filter({
        has: page.getByTestId('favorite-button-filled'),
      })
      await expect(favoriteCards).toHaveCount(2)
    })
  })

  test.describe('Reorder Favorites', () => {
    test('should reorder favorites via drag-and-drop and persist after refresh', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Wait for page to fully load and favorite buttons to appear
      await page.waitForLoadState('networkidle')

      // Favorite 3 activities
      const outlinedHearts = page.getByTestId('favorite-button-outlined')
      await expect(outlinedHearts.first()).toBeVisible({ timeout: 10000 })

      for (let i = 0; i < 3; i++) {
        await outlinedHearts.first().click()
        // Wait for the toast notification and mutation to complete
        await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
        await page.waitForTimeout(500)
      }

      // Navigate to profile favorites tab
      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      // Get the activity names in original order
      const titlesBefore = await page.locator('h3').allTextContents()
      expect(titlesBefore.length).toBe(3)

      // Get drag handles
      const dragHandles = page.getByTestId('drag-handle')
      await expect(dragHandles).toHaveCount(3)

      // Drag first item to third position
      const firstHandle = dragHandles.first()
      const thirdHandle = dragHandles.nth(2)

      const firstBox = await firstHandle.boundingBox()
      const thirdBox = await thirdHandle.boundingBox()

      if (firstBox && thirdBox) {
        await page.mouse.move(
          firstBox.x + firstBox.width / 2,
          firstBox.y + firstBox.height / 2
        )
        await page.mouse.down()
        await page.mouse.move(
          thirdBox.x + thirdBox.width / 2,
          thirdBox.y + thirdBox.height / 2 + 20,
          { steps: 10 }
        )
        await page.mouse.up()
      }

      // Wait for mutation to complete
      await page.waitForTimeout(1000)

      // Refresh page
      await page.reload()
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      // Get the activity names in new order
      const titlesAfter = await page.locator('h3').allTextContents()

      // Verify order changed (first item should now be at a different position)
      expect(titlesAfter).not.toEqual(titlesBefore)
      // The first item should now be last (or near last)
      expect(titlesAfter[titlesAfter.length - 1]).toBe(titlesBefore[0])
    })
  })

  test.describe('Cache Sync', () => {
    test('should sync favorites when navigating via SPA between discover and profile', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)

      // Visit "Mes favoris" tab to prime Apollo cache with empty state
      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()
      await expect(
        page.getByText("Vous n'avez pas encore de favoris")
      ).toBeVisible()

      // SPA navigate to discover page via nav link (no full reload)
      await page.getByRole('link', { name: 'Découvrez des activités' }).click()
      await page.waitForURL('/discover')
      await page.waitForLoadState('networkidle')

      // Favorite 2 activities
      const outlinedHearts = page.getByTestId('favorite-button-outlined')
      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      // SPA navigate back to profile via user menu
      const userIcon = page.locator('header').locator('svg.tabler-icon-user-circle').first()
      await userIcon.hover()
      await page.getByRole('menuitem').filter({ hasText: 'Profil' }).click()
      await page.waitForURL('/profil')

      // Click "Mes favoris" tab and verify favorites are shown (not stale empty state)
      await page.getByRole('tab', { name: 'Mes favoris' }).click()
      const favoriteCards = page.locator('[class*="Card"]').filter({
        has: page.getByTestId('favorite-button-filled'),
      })
      await expect(favoriteCards).toHaveCount(2)

      // SPA navigate to discover again
      await page.getByRole('link', { name: 'Découvrez des activités' }).click()
      await page.waitForURL('/discover')
      await page.waitForLoadState('networkidle')

      // Unfavorite one activity
      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await filledHeart.click()
      await expect(page.getByText('Retiré des favoris')).toBeVisible()
      await page.waitForTimeout(500)

      // SPA navigate back to profile
      await userIcon.hover()
      await page.getByRole('menuitem').filter({ hasText: 'Profil' }).click()
      await page.waitForURL('/profil')

      // Verify only 1 favorite remains
      await page.getByRole('tab', { name: 'Mes favoris' }).click()
      await expect(favoriteCards).toHaveCount(1)
    })
  })

  test.describe('Unfavorite', () => {
    test('should remove activity from favorites when unfavoriting', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Favorite an activity
      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await outlinedHeart.click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()

      // Click the filled heart again to unfavorite
      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await filledHeart.click()

      // Verify toast notification for removal
      await expect(page.getByText('Retiré des favoris')).toBeVisible()

      // Verify heart is now outlined again
      await expect(
        page.getByTestId('favorite-button-outlined').first()
      ).toBeVisible()

      // Navigate to profile and verify favorites tab is empty
      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      // Verify empty state message
      await expect(
        page.getByText("Vous n'avez pas encore de favoris")
      ).toBeVisible()
    })
  })
})
