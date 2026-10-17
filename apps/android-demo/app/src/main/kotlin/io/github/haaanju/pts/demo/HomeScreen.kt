@file:OptIn(ExperimentalMaterial3Api::class)

package io.github.haaanju.pts.demo

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import io.github.haaanju.pts.PtsFonts
import io.github.haaanju.pts.catalog.PtsCatalog
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.delay

private data class Project(val name: String, val detail: String, val status: Status)

private val projects = listOf(
    Project("Checkout redesign", "8 tasks · updated 2h ago", Status.Overdue),
    Project("Onboarding flow", "Kickoff on Monday", Status.New),
    Project("Settings revamp", "Due Friday · 3 tasks left", Status.DueSoon),
    Project("Dark mode audit", "Waiting on 2 reviewers", Status.InReview),
    Project("Design tokens v1", "Shipped 3 days ago", Status.Done),
    Project("Search results", "Shipped last week", Status.Done),
    Project("Notifications", "12 tasks · updated yesterday", Status.InReview),
)

/** A greeting for the time of day: 05–12 morning, 12–18 afternoon, 18–22 evening, otherwise late */
fun greeting(time: LocalTime): String = when (time.hour) {
    in 5..11 -> "Good morning"
    in 12..17 -> "Good afternoon"
    in 18..21 -> "Good evening"
    else -> "Working late"
}

/** The owner's app: what's new in the tokens, what the app is, the tokens at a glance, then sample project content */
@Composable
fun HomeScreen() {
    val p = LocalPlain.current
    val scroll = TopAppBarDefaults.enterAlwaysScrollBehavior()
    // The time, read again every minute, so a greeting left open from the morning doesn't stay "Good morning"
    var now by remember { mutableStateOf(LocalTime.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000)
            now = LocalTime.now()
        }
    }
    Scaffold(
        Modifier.nestedScroll(scroll.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Projects") },
                actions = {
                    IconButton({}) { Icon(Icons.Filled.Search, "Search") }
                    IconButton({}) {
                        BadgedBox(badge = { Badge { Text("3") } }) { Icon(Icons.Filled.Notifications, "Notifications") }
                    }
                },
                scrollBehavior = scroll,
            )
        },
    ) { padding ->
        LazyColumn(contentPadding = padding, verticalArrangement = Arrangement.spacedBy(p.spacing.gapBetweenMd)) {
            item {
                Text(
                    "${greeting(now)}, Hanju",
                    Modifier.padding(horizontal = p.spacing.paddingLg, vertical = p.spacing.gapWithinSm),
                    style = p.type.headingMd,
                    color = p.colors.contentBase,
                )
            }
            item { WhatsNew() }
            item { About() }
            item { AtAGlance() }
            item { Banner() }
            item { Summary() }
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    SectionTitle("Recent", Modifier.weight(1f))
                    TextButton({}, Modifier.padding(end = p.spacing.paddingSm)) { Text("See all") }
                }
            }
            items(projects) { project ->
                ListItem(
                    headlineContent = { Text(project.name) },
                    supportingContent = { Text(project.detail) },
                    leadingContent = { Initials(project.name) },
                    trailingContent = { StatusTag(project.status) },
                )
                HorizontalDivider(Modifier.padding(start = p.spacing.paddingLg))
            }
            item { BottomSpace() }
        }
    }
}

/** Code spans (`PtsColors.kt`) in mono, the way the docs set them */
@Composable
private fun withCode(text: String): AnnotatedString {
    val mono = SpanStyle(fontFamily = PtsFonts.mono)
    return buildAnnotatedString {
        text.split("`").forEachIndexed { i, part -> if (i % 2 == 1) withStyle(mono) { append(part) } else append(part) }
    }
}

/** This version's changelog entries, read at build time (ADR 0061), counted by kind: the entries themselves are in the changelog */
@Composable
private fun WhatsNew() {
    val p = LocalPlain.current
    val date = BuildConfig.RELEASE_DATE?.let { LocalDate.parse(it).format(DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.US)) }
    Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinLg)) {
        Column(verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
            Text("What's new in Plain ${BuildConfig.PTS_VERSION}", style = p.type.headingMd, color = p.colors.contentBase)
            if (date != null) Text("Released $date", style = p.type.bodyMd, color = p.colors.contentSubtle)
        }
        val kinds = BuildConfig.RELEASE_NOTES.groupingBy { it.substringBefore(":", "") }.eachCount()
        Row(horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
            kinds.forEach { (kind, count) -> ChangeTag("$count $kind") }
        }
    }
}

/** New is the discovery intent (new things), Fix the success one, as soft tags */
@Composable
private fun ChangeTag(label: String) {
    val p = LocalPlain.current
    val (fill, text) = when (label.substringAfter(" ")) {
        "New" -> p.colors.intentDiscoverySurfaceSubtle to p.colors.intentDiscoveryContentBase
        "Fix" -> p.colors.intentSuccessSurfaceSubtle to p.colors.intentSuccessContentBase
        else -> p.colors.surfaceStrong to p.colors.contentBase
    }
    Surface(color = fill, shape = RoundedCornerShape(p.border.radiusFull)) {
        Text(label, Modifier.padding(horizontal = p.spacing.paddingSm, vertical = p.spacing.space50), style = p.type.labelSm, color = text)
    }
}

@Composable
private fun About() {
    val p = LocalPlain.current
    Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinLg)) {
        Text("About this app", style = p.type.headingMd, color = p.colors.contentBase)
        Text(withCode("Material 3 components, styled by the `@pts/android` tokens."), style = p.type.bodyMd, color = p.colors.contentBase)
    }
}

/** The tokens the app reads, counted from the catalog, so the numbers follow the tokens */
@Composable
private fun AtAGlance() {
    val p = LocalPlain.current
    val counts = listOf(
        PtsCatalog.colors.entries.size to "colors",
        PtsCatalog.spacing.entries.size to "spacing",
        PtsCatalog.border.entries.size to "border",
        PtsCatalog.typography.entries.size to "text styles",
    )
    val modes = listOf(PtsCatalog.colors.modifier, PtsCatalog.spacing.modifier, PtsCatalog.border.modifier, PtsCatalog.typography.modifier)
    Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinLg)) {
        Text("At a glance", style = p.type.headingMd, color = p.colors.contentBase)
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(p.spacing.paddingXl), verticalArrangement = Arrangement.spacedBy(p.spacing.gapBetweenSm)) {
                Row(horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd)) {
                    counts.forEach { (n, label) -> Stat(n.toString(), label, Modifier.weight(1f)) }
                }
                Column(verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
                    Text("${modes.size} modes: ${modes.joinToString(", ")}", style = p.type.bodyMd, color = p.colors.contentBase)
                    Text("@pts/android ${BuildConfig.PTS_VERSION} · Terrazzo · Compose · Material 3", style = p.type.bodyMd, color = p.colors.contentSubtle)
                }
            }
        }
    }
}

/** A number in mono (Aspekta has no tabular figures) over its label */
@Composable
private fun Stat(value: String, label: String, modifier: Modifier = Modifier) {
    val p = LocalPlain.current
    Column(modifier, verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
        Text(value, style = p.type.headingLg.copy(fontFamily = PtsFonts.mono), color = p.colors.contentBase)
        Text(label, style = p.type.bodyMd, color = p.colors.contentSubtle)
    }
}

@Composable
private fun Initials(name: String) {
    val p = LocalPlain.current
    Box(Modifier.size(p.spacing.sizeControlMd).background(p.colors.surfaceStrong, CircleShape), contentAlignment = Alignment.Center) {
        Text(name.split(" ").take(2).joinToString("") { it.take(1).uppercase() }, style = p.type.labelMd, color = p.colors.contentBase)
    }
}

/** An info banner: the intent's soft fill and its content color, title and text the same size, told apart by weight */
@Composable
private fun Banner() {
    val p = LocalPlain.current
    Row(
        Modifier
            .padding(horizontal = p.spacing.paddingLg)
            .fillMaxWidth()
            .background(p.colors.intentInfoSurfaceSubtle, RoundedCornerShape(p.border.radiusContainer))
            .padding(p.spacing.paddingLg),
        horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd),
    ) {
        Icon(Icons.Filled.Info, null, tint = p.colors.intentInfoContentBase)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm)) {
            Text("Design review moved to Thursday", style = p.type.labelLg, color = p.colors.intentInfoContentBase)
            Text("The checkout redesign review is now Thursday at 2 PM.", style = p.type.bodyMd, color = p.colors.intentInfoContentBase)
        }
    }
}

/** A card of project numbers */
@Composable
private fun Summary() {
    val p = LocalPlain.current
    Card(Modifier.padding(horizontal = p.spacing.paddingLg).fillMaxWidth()) {
        Row(Modifier.padding(p.spacing.paddingXl), horizontalArrangement = Arrangement.spacedBy(p.spacing.gapBetweenSm)) {
            listOf("Open" to "12", "Due soon" to "03", "Done" to "28").forEach { (label, value) -> Stat(value, label, Modifier.weight(1f)) }
        }
    }
}
