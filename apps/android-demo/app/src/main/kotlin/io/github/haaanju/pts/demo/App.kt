package io.github.haaanju.pts.demo

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.vector.ImageVector

enum class Destination(val label: String, val icon: ImageVector) {
    Home("Home", Icons.Filled.Home),
    Tokens("Tokens", Icons.AutoMirrored.Filled.List),
    Components("Components", Icons.Filled.Build),
    Settings("Settings", Icons.Filled.Settings),
}

/** Adaptive navigation: a bottom bar on a phone, a rail on a wider window (Material 3's NavigationSuiteScaffold) */
@Composable
fun PlainApp(modes: Modes, onModes: (Modes) -> Unit) {
    var current by rememberSaveable { mutableStateOf(Destination.Home) }
    NavigationSuiteScaffold(
        navigationSuiteItems = {
            Destination.entries.forEach { d ->
                item(
                    selected = d == current,
                    onClick = { current = d },
                    icon = { Icon(d.icon, contentDescription = null) },
                    label = { Text(d.label) },
                )
            }
        },
    ) {
        when (current) {
            Destination.Home -> HomeScreen(onNavigate = { current = it })
            Destination.Components -> ComponentsScreen(modes, onModes)
            Destination.Tokens -> TokensScreen(modes, onModes)
            Destination.Settings -> SettingsScreen(modes, onModes)
        }
    }
}
