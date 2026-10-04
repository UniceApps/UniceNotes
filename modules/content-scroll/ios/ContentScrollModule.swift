import ExpoModulesCore
import UIKit

public class ContentScrollModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ContentScroll")

    View(ContentScrollMarkerView.self) {}
  }
}

// UIKit ne cherche la liste principale d'un écran que dans sa vue racine et le premier enfant de
// celle-ci : une ScrollView de React Native, bien plus profonde, lui échappe. Posé dans son contenu,
// ce repère invisible la déclare au contrôleur de l'onglet, qui la suit alors pour réduire la barre
// d'onglets au défilement (iOS 26).
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
