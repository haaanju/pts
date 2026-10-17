package io.github.haaanju.pts.demo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import io.github.haaanju.pts.PtsBorder
import io.github.haaanju.pts.PtsColors
import io.github.haaanju.pts.PtsSpacing
import io.github.haaanju.pts.PtsTypography

// A screen built only from @pts/android (ADR 0057, 0059): change a token, rebuild and publish the library, run the
// app again, and it changes. The buttons switch the theme, density, and shape, as data-* attributes do on the web.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var dark by remember { mutableStateOf<Boolean?>(null) }
            var compact by remember { mutableStateOf(false) }
            var round by remember { mutableStateOf(false) }
            val wide = LocalConfiguration.current.screenWidthDp >= 768 // breakpoint/md
            Screen(
                Plain(
                    colors = if (dark ?: isSystemInDarkTheme()) PtsColors.Dark else PtsColors.Light,
                    spacing = if (compact) PtsSpacing.Compact else PtsSpacing.Relaxed,
                    border = if (round) PtsBorder.Round else PtsBorder.Soft,
                    type = if (wide) PtsTypography.Wide else PtsTypography.Narrow,
                ),
                toggles = listOf(
                    "Theme" to { dark = !(dark ?: false) },
                    "Density" to { compact = !compact },
                    "Shape" to { round = !round },
                ),
                state = "${if (dark == true) "dark" else "light or system"} · ${if (compact) "compact" else "relaxed"} · ${if (round) "round" else "soft"}",
            )
        }
    }
}

/** The four token sets a screen reads, chosen once */
private class Plain(val colors: PtsColors, val spacing: PtsSpacing, val border: PtsBorder, val type: PtsTypography)

@Composable
private fun Screen(p: Plain, toggles: List<Pair<String, () -> Unit>>, state: String) {
    val c = p.colors
    val s = p.spacing
    val b = p.border
    val t = p.type
    val container = RoundedCornerShape(b.radiusContainer)
    Column(
        Modifier
            .fillMaxSize()
            .background(c.background)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(s.paddingXl),
        verticalArrangement = Arrangement.spacedBy(s.gapBetweenSm),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(s.gapWithinSm)) {
            Text("PLAIN", t.labelSm, c.contentSubtle)
            Text("Tokens on Android", t.displayMd, c.contentBase)
            Text("Colors, spacing, corners, and type from @pts/android. $state", t.bodyMd, c.contentSubtle)
        }

        FlowRow(horizontalArrangement = Arrangement.spacedBy(s.gapWithinSm), verticalArrangement = Arrangement.spacedBy(s.gapWithinSm)) {
            toggles.forEach { (label, onClick) -> Button(p, label, c.background, c.contentBase, outline = c.borderBase, onClick = onClick) }
        }

        // A card on the page, with buttons as tall as size/control/md
        Column(
            Modifier.fillMaxWidth().background(c.surfaceSubtle, container).padding(s.paddingLg),
            verticalArrangement = Arrangement.spacedBy(s.gapWithinMd),
        ) {
            Text("A card", t.headingSm, c.contentBase)
            Text("surface/subtle, radius/container, padding/lg. Body text in text/body-md.", t.bodyMd, c.contentSubtle)
            Row(horizontalArrangement = Arrangement.spacedBy(s.gapWithinSm)) {
                Button(p, "Save", c.inverseBase, c.contentInverseBase)
                Button(p, "Delete", c.intentDangerSurfaceBase, c.intentDangerContentInverse)
            }
            Text("val padding = spacing.paddingMd", t.codeMd, c.contentSubtle, Modifier.background(c.background, RoundedCornerShape(b.radiusSm)).padding(s.paddingSm))
        }

        Column(verticalArrangement = Arrangement.spacedBy(s.gapWithinSm)) {
            Text("Intents", t.headingSm, c.contentBase)
            Intent(p, "Danger", c.intentDangerSurfaceSubtle, c.intentDangerContentBase, c.intentDangerSurfaceBase, c.intentDangerContentInverse)
            Intent(p, "Warning", c.intentWarningSurfaceSubtle, c.intentWarningContentBase, c.intentWarningSurfaceBase, c.intentWarningContentInverse)
            Intent(p, "Success", c.intentSuccessSurfaceSubtle, c.intentSuccessContentBase, c.intentSuccessSurfaceBase, c.intentSuccessContentInverse)
            Intent(p, "Info", c.intentInfoSurfaceSubtle, c.intentInfoContentBase, c.intentInfoSurfaceBase, c.intentInfoContentInverse)
            Intent(p, "Discovery", c.intentDiscoverySurfaceSubtle, c.intentDiscoveryContentBase, c.intentDiscoverySurfaceBase, c.intentDiscoveryContentInverse)
        }
    }
}

@Composable
private fun Text(text: String, style: TextStyle, color: Color, modifier: Modifier = Modifier) = BasicText(text, modifier, style.copy(color = color))

/** A button-shaped box from the semantic tokens: size/control/md high, padding/xl wide, radius/control corners */
@Composable
private fun Button(p: Plain, label: String, fill: Color, content: Color, outline: Color? = null, onClick: () -> Unit = {}) {
    val shape = RoundedCornerShape(p.border.radiusControl)
    var m = Modifier.height(p.spacing.sizeControlMd).background(fill, shape)
    if (outline != null) m = m.border(p.border.strokeThin, outline, shape)
    Box(m.clickable(onClick = onClick).padding(horizontal = p.spacing.paddingXl), contentAlignment = Alignment.Center) {
        Text(label, p.type.labelLg, content)
    }
}

@Composable
private fun Intent(p: Plain, name: String, soft: Color, onSoft: Color, strong: Color, onStrong: Color) {
    val shape = RoundedCornerShape(p.border.radiusControl)
    Row(horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f).height(p.spacing.sizeControlMd).background(soft, shape).padding(horizontal = p.spacing.paddingLg), contentAlignment = Alignment.CenterStart) {
            Text("$name, soft", p.type.bodyMd, onSoft)
        }
        Box(Modifier.width(120.dp).height(p.spacing.sizeControlMd).background(strong, shape), contentAlignment = Alignment.Center) {
            Text(name, p.type.labelLg, onStrong)
        }
    }
}
