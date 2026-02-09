import { injectable, inject } from "inversify";
import { ViolationService } from "./violationService";
import "./violationUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";
import { Violation } from "../serialize/SavedDiagram";

@injectable()
export class ViolationUI extends AccordionUiExtension {
    static readonly ID = "violation-ui";

    constructor(@inject(ViolationService) private violationService: ViolationService) {
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
                    <div class="summary-text">
                        <p><p class="status-info">
                            No violation data found. Run a Analysis first.
                        </p></p>
                    </div>
                </div>

                <div id="ai-summary" class="tab-pane">
                    <div class="summary-text">
                        <p class="status-info">
                            No violation data found. Run a Analysis first, then enter your API key to generate an AI summary.
                        </p>
                    </div>
                    <div class="api-key-container">
                        <label for="ai-api-key">OpenAI API Key:</label>
                        <input type="password" id="ai-api-key" placeholder="Your API Key" />
                    </div>
                    <div class="button-container">
                        <button id="generate-btn" class="generate-btn">
                            <i class="fas fa-sync-alt"></i> Generate
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.violationService.onViolationsChanged((violations) => {
            this.updateSimpleTab(contentElement, violations);
        });

        this.setupTabLogic(contentElement);
        this.setupGenerateLogic(contentElement);
    }

    private setupGenerateLogic(container: HTMLElement) {
        const generateBtn = container.querySelector("#generate-btn") as HTMLButtonElement;

        generateBtn.addEventListener("click", () => {
            // Hier Logik für AI Call
        });
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

    private updateSimpleTab(container: HTMLElement, violations: Violation[]) {
        const simplePane = container.querySelector("#simple-summary .summary-text");
        if (!simplePane) return;

        if (violations.length === 0) {
            simplePane.innerHTML = `<p class="status-info">No violations found. Everything looks good!</p>`;
            return;
        }

        const listItems = violations
            .map(
                (v) => `
            <div class="violation-item">
                <strong>Violated constraint:</strong> ${v.constraint}<br>
                <small>Flow of violation cause : ${v.violationCauseGraph.join(", ")}</small>
            </div>
        `,
            )
            .join("");

        simplePane.innerHTML = `
            <div class="violation-header">Found ${violations.length} issues:</div>
            <div class="violation-list">${listItems}</div>
        `;
    }
}
