import { injectable } from "inversify";
import "./violationUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";

@injectable()
export class ViolationUI extends AccordionUiExtension {
    static readonly ID = "violation-ui";

    constructor() {
        super("left", "up");
    }

    id() {
        return ViolationUI.ID;
    }

    containerClass() {
        return ViolationUI.ID;
    }

    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = "Violation Summary";
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        contentElement.innerHTML = `
            <div class="violation-tabs">
                <button class="tab-btn active" data-tab="simple">Simple</button>
                <button class="tab-btn" data-tab="ai">AI Generated</button>
            </div>
            <div class="violation-content">
                <div id="simple-summary" class="tab-pane active">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
                </div>
                <div id="ai-summary" class="tab-pane">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam.</p>
                </div>
            </div>
        `;

        this.setupTabLogic(contentElement);
    }

    private setupTabLogic(container: HTMLElement) {
        const buttons = container.querySelectorAll(".tab-btn");
        const panes = container.querySelectorAll(".tab-pane");

        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-tab");

                buttons.forEach((b) => b.classList.remove("active"));
                panes.forEach((p) => p.classList.remove("active"));

                btn.classList.add("active");
                container.querySelector(`#${target}-summary`)?.classList.add("active");
            });
        });
    }
}
