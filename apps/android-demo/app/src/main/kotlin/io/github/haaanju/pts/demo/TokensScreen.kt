@file:OptIn(ExperimentalMaterial3Api::class)

package io.github.haaanju.pts.demo

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.min
import io.github.haaanju.pts.catalog.PtsCatalog

// The token pages, like the Storybook docs: token first, then its value in the current mode, the alias it points to,
// and its description, from PtsCatalog (ADR 0060). The mode bar switches the context the values come from.

private val tabs = listOf("Color", "Type", "Spacing", "Border")

@Composable
fun TokensScreen(modes: Modes, onModes: (Modes) -> Unit) {
    val p = LocalPlain.current
    var tab by rememberSaveable { mutableIntStateOf(0) }
    Scaffold(topBar = { TopAppBar(title = { Text("Tokens") }) }) { padding ->
        Column(Modifier.padding(padding), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd)) {
            ModeBar(modes, onModes)
            PrimaryTabRow(tab) {
                tabs.forEachIndexed { i, label -> Tab(tab == i, { tab = i }, text = { Text(label) }) }
            }
            LazyColumn {
                when (tab) {
                    0 -> colors()
                    1 -> type()
                    2 -> spacing()
                    else -> border()
                }
                item { BottomSpace() }
            }
        }
    }
}

// The context index the current mode reads from, per modifier
private fun <S> PtsCatalog.Group<S, *>.index(current: S) = contexts.indexOfFirst { it.second === current }

private fun hex(color: Color) = "#%06X".format(color.toArgb() and 0xFFFFFF) + (if (color.alpha < 1f) " · ${(color.alpha * 100).toInt()}%" else "")

private fun dp(value: Dp) = if (value.value % 1f == 0f) "${value.value.toInt()}dp" else "${value.value}dp"

/** The group a path belongs to on the docs' Color page: intent/danger/surface/base → intent/danger */
private fun section(path: String) = path.split("/").let { if (it[0] == "intent") "${it[0]}/${it[1]}" else it[0] }

private fun LazyListScope.colors() {
    // the docs' order: the layers, then what sits on them, then the colors outside the pairs (always/* last)
    PtsCatalog.colors.entries.groupBy { section(it.path) }.toList().sortedBy { (title, _) -> title == "always" }.forEach { (title, entries) ->
        item { Header(title) }
        items(entries) { e ->
            val p = LocalPlain.current
            val value = e.get(p.colors)
            Row2(
                sample = {
                    Box(Modifier.size(p.spacing.sizeControlMd).background(value, RoundedCornerShape(p.border.radiusMd)).border(p.border.strokeThin, p.colors.borderSubtle, RoundedCornerShape(p.border.radiusMd)))
                },
                path = e.path,
                value = hex(value),
                alias = e.aliases[PtsCatalog.colors.index(p.colors)],
                description = e.description,
            )
        }
    }
}

private fun LazyListScope.type() {
    items(PtsCatalog.typography.entries) { e ->
        val p = LocalPlain.current
        val style = e.get(p.type)
        Column(Modifier.padding(horizontal = p.spacing.paddingLg, vertical = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
            Text(e.path, style = p.type.codeMd, color = p.colors.contentSubtle)
            Text(if (e.path.startsWith("text/code")) "val gap = spacing.gapWithinSm" else "Plain tokens on Android", style = style, color = p.colors.contentBase)
            Text(
                "${style.fontSize.value.toInt()}/${style.lineHeight.value.toInt()} · ${style.fontWeight?.weight ?: FontWeight.Normal.weight} · ${style.letterSpacing.value}",
                style = p.type.codeMd,
                color = p.colors.contentSubtle,
            )
        }
        HorizontalDivider(Modifier.padding(horizontal = p.spacing.paddingLg))
    }
}

private fun LazyListScope.spacing() {
    PtsCatalog.spacing.entries.groupBy { it.path.split("/").let { s -> if (s[0] == "gap" || s[0] == "size") "${s[0]}/${s[1]}" else s[0] } }.forEach { (title, entries) ->
        item { Header(title) }
        items(entries) { e ->
            val p = LocalPlain.current
            val value = e.get(p.spacing)
            Row2(
                sampleWidth = p.spacing.space1600, // the largest step, so every bar keeps its length
                sample = { Box(Modifier.width(min(value, p.spacing.space1600)).height(p.spacing.space200).background(p.colors.inverseBase)) },
                path = e.path,
                value = dp(value),
                alias = e.aliases[PtsCatalog.spacing.index(p.spacing)],
                description = e.description,
            )
        }
    }
}

private fun LazyListScope.border() {
    PtsCatalog.border.entries.groupBy { it.path.split("/")[0] }.forEach { (title, entries) ->
        item { Header(title) }
        items(entries) { e ->
            val p = LocalPlain.current
            val value = e.get(p.border)
            Row2(
                sample = {
                    val shape = RoundedCornerShape(if (title == "radius") value else p.border.radiusMd)
                    val width = if (title == "radius") p.border.strokeThin else value
                    Box(Modifier.size(p.spacing.sizeControlMd).background(p.colors.surfaceSubtle, shape).border(width, p.colors.borderBase, shape))
                },
                path = e.path,
                value = dp(value),
                alias = e.aliases[PtsCatalog.border.index(p.border)],
                description = e.description,
            )
        }
    }
}

/** A section heading like the docs': the group's name, then the token path it covers, ending in a wildcard */
@Composable
private fun Header(group: String) {
    val p = LocalPlain.current
    val name = group.substringAfterLast("/").replaceFirstChar { it.uppercase() }
    Row(
        Modifier.padding(start = p.spacing.paddingLg, end = p.spacing.paddingLg, top = p.spacing.gapBetweenMd, bottom = p.spacing.gapWithinSm),
        horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm),
        verticalAlignment = Alignment.Bottom,
    ) {
        Text(name, style = p.type.headingSm, color = p.colors.contentBase)
        Text("$group/*", style = p.type.codeMd, color = p.colors.contentSubtle)
    }
}

/** A row like the docs' token tables: the sample, then the path, value, alias, and description */
@Composable
private fun Row2(sample: @Composable () -> Unit, path: String, value: String, alias: String, description: String, sampleWidth: Dp? = null) {
    val p = LocalPlain.current
    Row(
        Modifier.fillMaxWidth().padding(horizontal = p.spacing.paddingLg, vertical = p.spacing.paddingMd),
        horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinLg),
        verticalAlignment = Alignment.Top,
    ) {
        Box(Modifier.width(sampleWidth ?: p.spacing.sizeControlMd), contentAlignment = Alignment.CenterStart) { sample() }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
            Text(path, style = p.type.codeMd, color = p.colors.contentBase)
            Text(if (alias.isEmpty()) value else "$value  → $alias", style = p.type.codeMd, color = p.colors.contentSubtle)
            if (description.isNotEmpty()) Text(description, style = p.type.bodySm, color = p.colors.contentSubtle)
        }
    }
}
