package io.github.haaanju.pts.demo

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import io.github.haaanju.pts.PtsBorder
import io.github.haaanju.pts.PtsColors
import io.github.haaanju.pts.PtsSpacing
import io.github.haaanju.pts.PtsTypography

// The bridge from Plain's tokens to Material 3 (ADR 0060): Material's components read MaterialTheme, so each of its
// roles takes a semantic token. The mapping lives here, in the app, not in @pts/android (ADR 0059): the roles are
// Material's names, and another app may map them differently.

enum class ThemeChoice { System, Light, Dark }

/** The modes the app is in, chosen in Settings: one value per modifier, as data-* attributes are on the web */
@Immutable
data class Modes(val theme: ThemeChoice = ThemeChoice.System, val compact: Boolean = false, val round: Boolean = false)

/** The token sets a screen reads, picked once from the modes */
@Immutable
class Plain(val colors: PtsColors, val spacing: PtsSpacing, val border: PtsBorder, val type: PtsTypography, val dark: Boolean)

val LocalPlain = staticCompositionLocalOf<Plain> { error("PlainTheme is missing") }

/** Plain's tokens for this composition: LocalPlain.current, and MaterialTheme mapped from them */
@Composable
fun PlainTheme(plain: Plain, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalPlain provides plain) {
        MaterialTheme(
            colorScheme = colorScheme(plain.colors, plain.dark),
            typography = typography(plain.type),
            shapes = shapes(plain.border),
            content = content,
        )
    }
}

/**
 * Material's color roles from the semantic colors. Plain is neutral: Material's primary is the inverse fill (primary
 * buttons), tertiary is the discovery intent (new things, recommendations), and error is the danger intent. Plain has
 * one container layer, surface/subtle (cards, sheets, menus, the navigation bar); its strong and stronger steps are
 * hover and pressed fills, so every surfaceContainer role is surface/subtle. Every role is set, so no Material
 * baseline color shows through.
 */
fun colorScheme(c: PtsColors, dark: Boolean): ColorScheme {
    val roles: ColorScheme = if (dark) darkColorScheme() else lightColorScheme()
    return roles.copy(
        primary = c.inverseBase,
        onPrimary = c.contentInverseBase,
        primaryContainer = c.surfaceStrong,
        onPrimaryContainer = c.contentBase,
        inversePrimary = c.contentInverseBase,
        secondary = c.inverseStrong,
        onSecondary = c.contentInverseBase,
        secondaryContainer = c.surfaceStrong,
        onSecondaryContainer = c.contentBase,
        tertiary = c.intentDiscoverySurfaceBase,
        onTertiary = c.intentDiscoveryContentInverse,
        tertiaryContainer = c.intentDiscoverySurfaceSubtle,
        onTertiaryContainer = c.intentDiscoveryContentBase,
        background = c.background,
        onBackground = c.contentBase,
        surface = c.background,
        onSurface = c.contentBase,
        surfaceVariant = c.surfaceSubtle,
        onSurfaceVariant = c.contentSubtle,
        surfaceTint = Color.Transparent, // no tonal tint: Plain's layers are the surface ladder
        inverseSurface = c.inverseBase,
        inverseOnSurface = c.contentInverseBase,
        error = c.intentDangerSurfaceBase,
        onError = c.intentDangerContentInverse,
        errorContainer = c.intentDangerSurfaceSubtle,
        onErrorContainer = c.intentDangerContentBase,
        outline = c.borderBase,
        outlineVariant = c.borderSubtle,
        scrim = c.utilityScrim,
        surfaceBright = c.background,
        surfaceDim = c.surfaceStrong,
        surfaceContainerLowest = c.background,
        surfaceContainerLow = c.surfaceSubtle,
        surfaceContainer = c.surfaceSubtle,
        surfaceContainerHigh = c.surfaceSubtle,
        surfaceContainerHighest = c.surfaceSubtle,
    )
}

/** Material's type scale from the text styles. Material has 15 slots and Plain 13 styles, so some share one. */
fun typography(t: PtsTypography) = Typography(
    displayLarge = t.displayLg,
    displayMedium = t.displayMd,
    displaySmall = t.headingLg,
    headlineLarge = t.headingLg,
    headlineMedium = t.headingMd,
    headlineSmall = t.headingSm,
    titleLarge = t.headingSm,
    titleMedium = t.labelLg,
    titleSmall = t.labelMd,
    bodyLarge = t.bodyMd,
    bodyMedium = t.bodySm,
    bodySmall = t.caption,
    labelLarge = t.labelLg,
    labelMedium = t.labelMd,
    labelSmall = t.labelSm,
)

/** Material's shapes from the radius roles: controls and containers follow the shape mode, as on the web */
fun shapes(b: PtsBorder) = Shapes(
    extraSmall = RoundedCornerShape(b.radiusSm),
    small = RoundedCornerShape(b.radiusControl), // buttons, chips, text fields
    medium = RoundedCornerShape(b.radiusContainer), // cards
    large = RoundedCornerShape(b.radiusLg), // menus and popovers keep radius/lg
    extraLarge = RoundedCornerShape(b.radiusContainer), // dialogs and sheets
)
