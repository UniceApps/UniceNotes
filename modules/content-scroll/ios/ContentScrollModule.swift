import ExpoModulesCore
import UIKit

public class ContentScrollModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ContentScroll")

    View(ContentScrollMarkerView.self) {}
  }
}

// repère qui signale la ScrollView au contrôleur d'onglet, pour réduire la barre au défilement (iOS 26)
final class ContentScrollMarkerView: ExpoView {
  private weak var registeredScrollView: UIScrollView?
  private weak var registeredController: UIViewController?

  // l'onglet n'entre dans la fenêtre qu'à sa première ouverture : contrôleur et liste sont alors en place
  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil,
          let scrollView = enclosingScrollView(),
          let controller = owningController(of: scrollView)
    else {
      return
    }
    if scrollView === registeredScrollView && controller === registeredController {
      return
    }
    // la barre d'onglets suit le bord bas
    controller.setContentScrollView(scrollView, for: .bottom)
    registeredScrollView = scrollView
    registeredController = controller
  }

  private func enclosingScrollView() -> UIScrollView? {
    var view = superview
    while let current = view {
      if let scrollView = current as? UIScrollView {
        return scrollView
      }
      view = current.superview
    }
    return nil
  }

  // le contrôleur le plus proche : celui de l'onglet
  private func owningController(of view: UIView) -> UIViewController? {
    var responder: UIResponder? = view
    while let current = responder {
      if let controller = current as? UIViewController {
        return controller
      }
      responder = current.next
    }
    return nil
  }
}
