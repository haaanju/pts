@file:OptIn(ExperimentalMaterial3Api::class)

package io.github.haaanju.pts.demo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ListItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/** The modes as an app's settings: theme, density, and shape, the modifiers the web sets with data-* attributes */
@Composable
fun SettingsScreen(modes: Modes, onModes: (Modes) -> Unit) {
    val p = LocalPlain.current
    Scaffold(topBar = { TopAppBar(title = { Text("Settings") }) }) { padding ->
        LazyColumn(contentPadding = padding) {
            item { SectionTitle("Appearance", Modifier.padding(top = p.spacing.gapWithinSm, bottom = p.spacing.gapWithinXs)) }
            item {
                Choice("Theme", "Light and dark colors. System follows the device.", ThemeChoice.entries.map { it.name }, modes.theme.ordinal) {
                    onModes(modes.copy(theme = ThemeChoice.entries[it]))
                }
            }
            item {
                Choice("Density", "Relaxed meets the 48dp touch target; compact steps padding, gaps, and controls down.", listOf("Relaxed", "Compact"), if (modes.compact) 1 else 0) {
                    onModes(modes.copy(compact = it == 1))
                }
            }
            item {
                Choice("Shape", "Soft corners, or pills for controls and rounder containers.", listOf("Soft", "Round"), if (modes.round) 1 else 0) {
                    onModes(modes.copy(round = it == 1))
                }
            }
            item { HorizontalDivider(Modifier.padding(vertical = p.spacing.gapWithinSm)) }
            item { SectionTitle("About", Modifier.padding(bottom = p.spacing.gapWithinXs)) }
            item { ListItem(headlineContent = { Text("Tokens") }, supportingContent = { Text("@pts/android ${BuildConfig.PTS_VERSION}") }) }
            item { ListItem(headlineContent = { Text("Source") }, supportingContent = { Text("github.com/haaanju/pts") }) }
            item { ListItem(headlineContent = { Text("Built with") }, supportingContent = { Text("Terrazzo, Jetpack Compose, and Material 3") }) }
        }
    }
}

@Composable
private fun Choice(title: String, detail: String, options: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    val p = LocalPlain.current
    ListItem(
        headlineContent = { Text(title) },
        supportingContent = {
            Column(verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
                Text(detail)
                SingleChoiceSegmentedButtonRow {
                    options.forEachIndexed { i, label ->
                        SegmentedButton(selected == i, { onSelect(i) }, SegmentedButtonDefaults.itemShape(i, options.size, controlShape())) { Text(label) }
                    }
                }
            }
        },
    )
}
