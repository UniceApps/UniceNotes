package expo.modules.websession

import android.webkit.CookieManager
import android.webkit.WebStorage
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// la WebView Android garde ses cookies : il suffit de forcer leur écriture sur le disque
class WebSessionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WebSession")

    AsyncFunction("restoreAsync") {
      0
    }

    AsyncFunction("persistAsync") {
      CookieManager.getInstance().flush()
      0
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("clearAsync") { promise: Promise ->
      WebStorage.getInstance().deleteAllData()
      val cookies = CookieManager.getInstance()
      cookies.removeAllCookies {
        cookies.flush()
        promise.resolve()
      }
    }.runOnQueue(Queues.MAIN)
  }
}
