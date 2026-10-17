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
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.haaanju.pts.PtsColors

// A screen built only from PtsColors: change a semantic color, run `npm run build`, run the app again, and it changes.
// Sizes are plain dp until @pts/android writes spacing and type.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var dark by remember { mutableStateOf<Boolean?>(null) }
            val colors = if (dark ?: isSystemInDarkTheme()) PtsColors.Dark else PtsColors.Light
            Screen(colors, onToggle = { dark = !(dark ?: false) })
        }
    }
}

@Composable
private fun Screen(colors: PtsColors, onToggle: () -> Unit) {
    val corner = RoundedCornerShape(8.dp)
    Column(
        Modifier
            .fillMaxSize()
            .background(colors.background)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Label("Plain", colors.contentSubtle)
        BasicText("Tokens on Android", style = TextStyle(color = colors.contentBase, fontSize = 32.sp, fontWeight = FontWeight.Bold))
        Label("Every color on this screen comes from PtsColors, generated from @pts/tokens.", colors.contentSubtle)

        // A card on the page
        Column(
            Modifier.fillMaxWidth().background(colors.surfaceSubtle, corner).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            BasicText("Card on surface/subtle", style = TextStyle(color = colors.contentBase, fontSize = 20.sp, fontWeight = FontWeight.Bold))
            Label("Text in content/base and content/subtle.", colors.contentSubtle)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Pill("Primary", colors.inverseBase, colors.contentInverseBase, corner)
                Pill("Danger", colors.intentDangerSurfaceBase, colors.intentDangerContentInverse, corner)
                Pill("Toggle theme", colors.background, colors.contentBase, corner, border = colors.borderSubtle, onClick = onToggle)
            }
        }

        // The intents, soft and strong
        Label("Intents", colors.contentSubtle)
        Intent("Danger", colors.intentDangerSurfaceSubtle, colors.intentDangerContentBase, colors.intentDangerSurfaceBase, colors.intentDangerContentInverse, corner)
        Intent("Warning", colors.intentWarningSurfaceSubtle, colors.intentWarningContentBase, colors.intentWarningSurfaceBase, colors.intentWarningContentInverse, corner)
        Intent("Success", colors.intentSuccessSurfaceSubtle, colors.intentSuccessContentBase, colors.intentSuccessSurfaceBase, colors.intentSuccessContentInverse, corner)
        Intent("Info", colors.intentInfoSurfaceSubtle, colors.intentInfoContentBase, colors.intentInfoSurfaceBase, colors.intentInfoContentInverse, corner)
        Intent("Discovery", colors.intentDiscoverySurfaceSubtle, colors.intentDiscoveryContentBase, colors.intentDiscoverySurfaceBase, colors.intentDiscoveryContentInverse, corner)
    }
}

@Composable
private fun Label(text: String, color: Color) = BasicText(text, style = TextStyle(color = color, fontSize = 16.sp))

@Composable
private fun Pill(text: String, fill: Color, content: Color, shape: RoundedCornerShape, border: Color? = null, onClick: () -> Unit = {}) {
    var m = Modifier.background(fill, shape)
    if (border != null) m = m.border(1.dp, border, shape)
    Box(m.clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp), contentAlignment = Alignment.Center) {
        BasicText(text, style = TextStyle(color = content, fontSize = 16.sp, fontWeight = FontWeight.Medium))
    }
}

@Composable
private fun Intent(name: String, soft: Color, onSoft: Color, strong: Color, onStrong: Color, shape: RoundedCornerShape) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f).background(soft, shape).padding(16.dp)) {
            BasicText("$name, soft", style = TextStyle(color = onSoft, fontSize = 16.sp))
        }
        Box(Modifier.size(width = 120.dp, height = 52.dp).background(strong, shape), contentAlignment = Alignment.Center) {
            BasicText(name, style = TextStyle(color = onStrong, fontSize = 16.sp, fontWeight = FontWeight.Medium))
        }
    }
}
