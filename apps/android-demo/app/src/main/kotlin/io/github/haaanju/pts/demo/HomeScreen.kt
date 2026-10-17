@file:OptIn(ExperimentalMaterial3Api::class)

package io.github.haaanju.pts.demo

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import io.github.haaanju.pts.PtsFonts

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

/** Dummy content, so the tokens show in an app rather than a specimen */
@Composable
fun HomeScreen() {
    val p = LocalPlain.current
    val scroll = TopAppBarDefaults.enterAlwaysScrollBehavior()
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
        floatingActionButton = {
            // The main action: Plain's inverse fill, not Material's primaryContainer
            ExtendedFloatingActionButton(
                onClick = {},
                icon = { Icon(Icons.Filled.Add, null) },
                text = { Text("New project") },
                containerColor = p.colors.inverseBase,
                contentColor = p.colors.contentInverseBase,
            )
        },
    ) { padding ->
        LazyColumn(
            contentPadding = padding,
            verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinMd),
        ) {
            item {
                Column(Modifier.padding(horizontal = p.spacing.paddingLg), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
                    Text("Good morning", style = p.type.headingMd, color = p.colors.contentBase)
                    Text("7 projects, 2 need your attention today.", style = p.type.bodyMd, color = p.colors.contentSubtle)
                }
            }
            item { Banner() }
            item { Summary() }
            item {
                Row(Modifier.fillMaxWidth().padding(top = p.spacing.gapWithinSm), verticalAlignment = Alignment.CenterVertically) {
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
            item { Spacer(Modifier.height(p.spacing.gapSectionLg)) } // room above the floating button
        }
    }
}

@Composable
private fun Initials(name: String) {
    val p = LocalPlain.current
    Box(Modifier.size(p.spacing.sizeControlSm + p.spacing.space200).background(p.colors.surfaceStrong, CircleShape), contentAlignment = Alignment.Center) {
        Text(name.split(" ").take(2).joinToString("") { it.take(1).uppercase() }, style = p.type.labelMd, color = p.colors.contentBase)
    }
}

/** An info banner: the intent's soft fill, its content color, and a text action */
@Composable
private fun Banner() {
    val p = LocalPlain.current
    Row(
        Modifier
            .padding(horizontal = p.spacing.paddingLg)
            .fillMaxWidth()
            .background(p.colors.intentInfoSurfaceSubtle, RoundedCornerShape(p.border.radiusContainer))
            .padding(p.spacing.paddingMd),
        horizontalArrangement = Arrangement.spacedBy(p.spacing.gapWithinSm),
    ) {
        Icon(Icons.Filled.Info, null, tint = p.colors.intentInfoContentBase)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
            Text("Tokens 0.10 are out", style = p.type.labelLg, color = p.colors.intentInfoContentBase)
            Text("Spacing, corners, and type now reach Android too.", style = p.type.bodySm, color = p.colors.intentInfoContentBase)
        }
    }
}

/** A card of numbers: mono digits line up (Aspekta has no tabular figures) */
@Composable
private fun Summary() {
    val p = LocalPlain.current
    Card(Modifier.padding(horizontal = p.spacing.paddingLg).fillMaxWidth()) {
        Row(Modifier.padding(p.spacing.paddingLg), horizontalArrangement = Arrangement.spacedBy(p.spacing.gapBetweenSm)) {
            listOf("Open" to "12", "Due soon" to "03", "Done" to "28").forEach { (label, value) ->
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(p.spacing.gapWithinXs)) {
                    Text(value, style = p.type.headingMd.copy(fontFamily = PtsFonts.mono), color = p.colors.contentBase)
                    Text(label, style = p.type.bodySm, color = p.colors.contentSubtle)
                }
            }
        }
    }
}
