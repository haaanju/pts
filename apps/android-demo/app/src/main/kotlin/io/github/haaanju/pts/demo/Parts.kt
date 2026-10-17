package io.github.haaanju.pts.demo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

// Small pieces the screens share

/** Button sizes from the tokens: Material's default height is 40dp; Plain's control height follows the density */
@Composable
fun Modifier.control(): Modifier = height(LocalPlain.current.spacing.sizeControlMd)

@Composable
fun controlPadding() = PaddingValues(horizontal = LocalPlain.current.spacing.paddingXl)

/** Material's buttons and segmented buttons default to a full pill; Plain's take radius/control (shapes.small) */
@Composable
fun controlShape() = MaterialTheme.shapes.small

/** Theme, density, and shape at the top of a docs screen, like the toolbar buttons in the Storybook docs */
@Composable
fun ModeBar(modes: Modes, onModes: (Modes) -> Unit) {
    val p = LocalPlain.current
    Row(
        Modifier.fillMaxWidth().padding(horizontal = p.spacing.paddingLg),
        horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm),
    ) {
        FilterChip(p.dark, { onModes(modes.copy(theme = if (p.dark) ThemeChoice.Light else ThemeChoice.Dark)) }, { Text("Dark") })
        FilterChip(modes.compact, { onModes(modes.copy(compact = !modes.compact)) }, { Text("Compact") })
        FilterChip(modes.round, { onModes(modes.copy(round = !modes.round)) }, { Text("Round") })
    }
}

/** A section title on a screen */
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    val p = LocalPlain.current
    Text(text, modifier.padding(horizontal = p.spacing.paddingLg), style = p.type.headingSm, color = p.colors.contentBase)
}

enum class Status(val label: String) { Overdue("Overdue"), DueSoon("Due soon"), InReview("In review"), Done("Done"), New("New") }

/** A soft intent tag: intent surface/subtle with its content/base on top, the pair pts/contrast checks */
@Composable
fun StatusTag(status: Status) {
    val c = LocalPlain.current.colors
    val (fill, text: Color) = when (status) {
        Status.Overdue -> c.intentDangerSurfaceSubtle to c.intentDangerContentBase
        Status.DueSoon -> c.intentWarningSurfaceSubtle to c.intentWarningContentBase
        Status.InReview -> c.intentInfoSurfaceSubtle to c.intentInfoContentBase
        Status.Done -> c.intentSuccessSurfaceSubtle to c.intentSuccessContentBase
        Status.New -> c.intentDiscoverySurfaceSubtle to c.intentDiscoveryContentBase
    }
    val p = LocalPlain.current
    Surface(color = fill, shape = RoundedCornerShape(p.border.radiusFull)) {
        Text(status.label, Modifier.padding(horizontal = p.spacing.paddingSm, vertical = p.spacing.space50), style = p.type.labelSm, color = text)
    }
}
