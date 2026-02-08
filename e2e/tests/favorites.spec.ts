import { test, expect, Page } from '@playwright/test'

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
  await page.waitForURL('/profil')
}

async function clearUserFavorites(page: Page) {
  await page.goto('/profil')
  await page.getByRole('tab', { name: 'Mes favoris' }).click()

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

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

      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()

      await outlinedHeart.click()

      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await expect(filledHeart).toBeVisible()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    })

    test('should toggle favorite from activity detail page', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      // Scope to card to avoid matching the section "Voir plus" button
      await page.locator('[class*="Card"]').first().getByRole('link', { name: 'Voir plus' }).click()
      await page.waitForURL(/\/activities\//)

      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()

      await page.waitForTimeout(500)
      await page.getByTestId('favorite-button-outlined').first().click()

      await expect(page.getByTestId('favorite-button-filled').first()).toBeVisible()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    })
  })

  test.describe('State Consistency', () => {
    test('should maintain favorite state across pages', async ({ page }) => {
      await login(page)
      await clearUserFavorites(page)
      await page.goto('/')

      await page.waitForLoadState('networkidle')

      const firstCard = page.locator('[class*="Card"]').first()
      const firstActivityLink = firstCard.getByRole('link', { name: 'Voir plus' })

      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await outlinedHeart.click()
      await expect(page.getByTestId('favorite-button-filled').first()).toBeVisible()

      await page.waitForTimeout(500)

      await firstActivityLink.click()
      await page.waitForURL(/\/activities\//)

      await expect(page.getByTestId('favorite-button-filled')).toBeVisible()
    })
  })

  test.describe('Unauthenticated User', () => {
    test('should redirect to signin when clicking favorite without login', async ({
      page,
    }) => {
      await page.goto('/')

      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await expect(outlinedHeart).toBeVisible()
      await outlinedHeart.click()

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

      const outlinedHearts = page.getByTestId('favorite-button-outlined')

      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()

      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

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

      await page.waitForLoadState('networkidle')

      const outlinedHearts = page.getByTestId('favorite-button-outlined')
      await expect(outlinedHearts.first()).toBeVisible({ timeout: 10000 })

      for (let i = 0; i < 3; i++) {
        await outlinedHearts.first().click()
        await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
        await page.waitForTimeout(500)
      }

      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      const titlesBefore = await page.locator('h3').allTextContents()
      expect(titlesBefore.length).toBe(3)

      const dragHandles = page.getByTestId('drag-handle')
      await expect(dragHandles).toHaveCount(3)

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

      await page.waitForTimeout(1000)

      await page.reload()
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      const titlesAfter = await page.locator('h3').allTextContents()

      expect(titlesAfter).not.toEqual(titlesBefore)
      expect(titlesAfter[titlesAfter.length - 1]).toBe(titlesBefore[0])
    })
  })

  test.describe('Cache Sync', () => {
    test('should sync favorites when navigating via SPA between discover and profile', async ({
      page,
    }) => {
      await login(page)
      await clearUserFavorites(page)

      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()
      await expect(
        page.getByText("Vous n'avez pas encore de favoris")
      ).toBeVisible()

      await page.getByRole('link', { name: 'Découvrez des activités' }).click()
      await page.waitForURL('/discover')
      await page.waitForLoadState('networkidle')

      const outlinedHearts = page.getByTestId('favorite-button-outlined')
      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      await outlinedHearts.first().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await page.waitForTimeout(500)

      const userIcon = page.locator('header').locator('svg.tabler-icon-user-circle').first()
      await userIcon.hover()
      await page.getByRole('menuitem').filter({ hasText: 'Profil' }).click()
      await page.waitForURL('/profil')

      await page.getByRole('tab', { name: 'Mes favoris' }).click()
      const favoriteCards = page.locator('[class*="Card"]').filter({
        has: page.getByTestId('favorite-button-filled'),
      })
      await expect(favoriteCards).toHaveCount(2)

      await page.getByRole('link', { name: 'Découvrez des activités' }).click()
      await page.waitForURL('/discover')
      await page.waitForLoadState('networkidle')

      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await filledHeart.click()
      await expect(page.getByText('Retiré des favoris')).toBeVisible()
      await page.waitForTimeout(500)

      await userIcon.hover()
      await page.getByRole('menuitem').filter({ hasText: 'Profil' }).click()
      await page.waitForURL('/profil')

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

      const outlinedHeart = page.getByTestId('favorite-button-outlined').first()
      await outlinedHeart.click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()

      const filledHeart = page.getByTestId('favorite-button-filled').first()
      await filledHeart.click()

      await expect(page.getByText('Retiré des favoris')).toBeVisible()

      await expect(
        page.getByTestId('favorite-button-outlined').first()
      ).toBeVisible()

      await page.goto('/profil')
      await page.getByRole('tab', { name: 'Mes favoris' }).click()

      await expect(
        page.getByText("Vous n'avez pas encore de favoris")
      ).toBeVisible()
    })
  })
})
