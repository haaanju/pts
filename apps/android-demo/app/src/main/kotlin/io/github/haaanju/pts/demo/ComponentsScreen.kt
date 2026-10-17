@file:OptIn(ExperimentalMaterial3Api::class)

package io.github.haaanju.pts.demo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.InputChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kotlinx.coroutines.launch

/** Material 3's own components, themed only through MaterialTheme (Theme.kt) and the control size */
@Composable
fun ComponentsScreen(modes: Modes, onModes: (Modes) -> Unit) {
    val p = LocalPlain.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var dialog by remember { mutableStateOf(false) }
    Scaffold(topBar = { TopAppBar(title = { Text("Components") }) }, snackbarHost = { SnackbarHost(snackbar) }) { padding ->
        LazyColumn(contentPadding = padding, verticalArrangement = Arrangement.spacedBy(p.spacing.gapBetweenMd)) {
            item { ModeBar(modes, onModes) }
            item {
                Group("Buttons") {
                    Button({}, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Primary") }
                    FilledTonalButton({}, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Tonal") }
                    OutlinedButton({}, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Secondary") }
                    TextButton({}, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Ghost") }
                    Button(
                        {},
                        Modifier.control(),
                        shape = controlShape(),
                        colors = ButtonDefaults.buttonColors(containerColor = p.colors.intentDangerSurfaceBase, contentColor = p.colors.intentDangerContentInverse),
                        contentPadding = controlPadding(),
                    ) { Text("Delete") }
                    Button({}, Modifier.control(), enabled = false, shape = controlShape(), contentPadding = controlPadding()) { Text("Disabled") }
                }
            }
            item {
                Group("Icon buttons") {
                    IconButton({}) { Icon(Icons.Filled.Favorite, "Like") }
                    FilledIconButton({}) { Icon(Icons.Filled.Edit, "Edit") }
                    OutlinedIconButton({}) { Icon(Icons.Filled.Share, "Share") }
                    FloatingActionButton({}, containerColor = p.colors.inverseBase, contentColor = p.colors.contentInverseBase) { Icon(Icons.Filled.Add, "Add") }
                }
            }
            item {
                var selected by remember { mutableStateOf(true) }
                Group("Chips") {
                    AssistChip({}, { Text("Add to calendar") })
                    FilterChip(selected, { selected = !selected }, { Text("Due this week") }, leadingIcon = if (selected) ({ Icon(Icons.Filled.Check, null) }) else null)
                    InputChip(true, {}, { Text("Design") }, trailingIcon = { Icon(Icons.Filled.Delete, "Remove") })
                }
            }
            item {
                var on by remember { mutableStateOf(true) }
                var checked by remember { mutableStateOf(true) }
                var radio by remember { mutableIntStateOf(0) }
                Group("Selection") {
                    Switch(on, { on = it })
                    Checkbox(checked, { checked = it })
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(radio == 0, { radio = 0 })
                        Text("List", style = p.type.bodyMd, color = p.colors.contentBase)
                        RadioButton(radio == 1, { radio = 1 })
                        Text("Board", style = p.type.bodyMd, color = p.colors.contentBase)
                    }
                }
            }
            item {
                var index by remember { mutableIntStateOf(1) }
                Group("Segmented button") {
                    SingleChoiceSegmentedButtonRow {
                        listOf("Day", "Week", "Month").forEachIndexed { i, label ->
                            SegmentedButton(index == i, { index = i }, SegmentedButtonDefaults.itemShape(i, 3, controlShape())) { Text(label) }
                        }
                    }
                }
            }
            item {
                var value by remember { mutableFloatStateOf(0.4f) }
                var text by remember { mutableStateOf("Checkout redesign") }
                Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd)) {
                    Text("Inputs", style = p.type.headingSm, color = p.colors.contentBase)
                    OutlinedTextField(text, { text = it }, Modifier.fillMaxWidth(), label = { Text("Project name") }, supportingText = { Text("Shown on the board and in search") })
                    Slider(value, { value = it })
                }
            }
            item {
                Group("Progress") {
                    LinearProgressIndicator({ 0.6f }, Modifier.fillMaxWidth())
                    CircularProgressIndicator()
                }
            }
            item {
                Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd)) {
                    Text("Cards", style = p.type.headingSm, color = p.colors.contentBase)
                    Card(Modifier.fillMaxWidth()) { CardText("Card", "surface/subtle, radius/container") }
                    OutlinedCard(Modifier.fillMaxWidth()) { CardText("Outlined card", "background with border/subtle") }
                    ElevatedCard(Modifier.fillMaxWidth()) { CardText("Elevated card", "Material's shadow, not Plain's shadow tokens yet") }
                }
            }
            item {
                Group("Dialog and snackbar") {
                    OutlinedButton({ dialog = true }, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Open dialog") }
                    OutlinedButton({ scope.launch { snackbar.showSnackbar("Project archived", "Undo") } }, Modifier.control(), shape = controlShape(), contentPadding = controlPadding()) { Text("Show snackbar") }
                }
            }
            item { BottomSpace() }
        }
    }
    if (dialog) {
        AlertDialog(
            onDismissRequest = { dialog = false },
            title = { Text("Archive project?") },
            text = { Text("Checkout redesign moves to the archive. You can restore it later.") },
            confirmButton = { TextButton({ dialog = false }) { Text("Archive") } },
            dismissButton = { TextButton({ dialog = false }) { Text("Cancel") } },
        )
    }
}

/** A section: its title, then its components in a wrapping row */
@Composable
private fun Group(title: String, content: @Composable () -> Unit) {
    val p = LocalPlain.current
    Column(verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd)) {
        SectionTitle(title)
        FlowRow(
            Modifier.padding(horizontal = p.spacing.paddingLg),
            horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd),
            verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd),
            itemVerticalAlignment = Alignment.CenterVertically,
        ) { content() }
    }
}

@Composable
private fun CardText(title: String, detail: String) {
    val p = LocalPlain.current
    Column(Modifier.padding(p.spacing.paddingXl), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
        // Explicit colors: surface/subtle is also surfaceVariant, so Material would pick onSurfaceVariant for the title
        Text(title, style = p.type.labelLg, color = p.colors.contentBase)
        Text(detail, style = p.type.bodySm, color = p.colors.contentSubtle)
    }
}
