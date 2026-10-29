package io.github.haaanju.pts.demo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalConfiguration
import io.github.haaanju.pts.PtsBorder
import io.github.haaanju.pts.PtsColors
import io.github.haaanju.pts.PtsComponentColors
import io.github.haaanju.pts.PtsSpacing
import io.github.haaanju.pts.PtsTypography

// Plain on Android (ADR 0057, 0060): a small app built from @pts/android and Material 3. Change a token, rebuild and
// publish the library, run the app again, and it changes.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var theme by rememberSaveable { mutableStateOf(ThemeChoice.System) }
            var compact by rememberSaveable { mutableStateOf(false) }
            var round by rememberSaveable { mutableStateOf(false) }
            val modes = Modes(theme, compact, round)
            val dark = when (theme) {
                ThemeChoice.System -> isSystemInDarkTheme()
                ThemeChoice.Light -> false
                ThemeChoice.Dark -> true
            }
            // The status and navigation bar icons follow the app's theme, which can differ from the system's
            LaunchedEffect(dark) {
                val bars = if (dark) SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
                else SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT)
                enableEdgeToEdge(statusBarStyle = bars, navigationBarStyle = bars)
            }
            val wide = LocalConfiguration.current.screenWidthDp >= 768 // breakpoint/md
            val plain = Plain(
                colors = if (dark) PtsColors.Dark else PtsColors.Light,
                components = if (dark) PtsComponentColors.Dark else PtsComponentColors.Light,
                spacing = if (compact) PtsSpacing.Compact else PtsSpacing.Relaxed,
                border = if (round) PtsBorder.Round else PtsBorder.Soft,
                type = if (wide) PtsTypography.Wide else PtsTypography.Narrow,
                dark = dark,
            )
            PlainTheme(plain) {
                PlainApp(modes, onModes = { theme = it.theme; compact = it.compact; round = it.round })
            }
        }
    }
}
