import { ActionDispatcher, CommandExecutionContext, ILogger, TYPES } from "sprotty";
import { FileData, LoadJsonCommand } from "./loadJson";
import { CURRENT_VERSION, SavedDiagram, Violation } from "./SavedDiagram";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SETTINGS } from "../settings/Settings";
import { FileName } from "../fileName/fileName";
import { DfdWebSocket } from "../webSocket/webSocket";
import { inject } from "inversify";
import { EditorModeController } from "../settings/editorMode";
import { Action } from "sprotty-protocol";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { ViolationService } from "../violationUi/violationService";

export namespace AnalyzeAction {
    export const KIND = "analyze";

    export function create(): Action {
        return { kind: KIND };
    }
}
export class AnalyzeCommand extends LoadJsonCommand {
    static readonly KIND = AnalyzeAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(FileName) fileName: FileName,
        @inject(DfdWebSocket) private readonly dfdWebSocket: DfdWebSocket,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator,
        @inject(ViolationService) private violationService: ViolationService,
    ) {
        super(
            logger,
            labelTypeRegistry,
            constraintRegistry,
            editorModeController,
            actionDispatcher,
            fileName,
            loadingIndicator,
        );
    }

    protected async getFile(context: CommandExecutionContext): Promise<FileData<SavedDiagram> | undefined> {
        const savedDiagram: SavedDiagram = {
            model: context.modelFactory.createSchema(context.root),
            labelTypes: this.labelTypeRegistry.getLabelTypes(),
            constraints: this.constraintRegistry.getConstraintList(),
            mode: this.editorModeController.get(),
            version: CURRENT_VERSION,
        };

        const response = await this.dfdWebSocket.requestDiagram("Json:" + JSON.stringify(savedDiagram));

        // Temporäre Dummy-Daten für die Verletzungen, um die Funktionalität der ViolationUI zu demonstrieren
        if (response && response.content) {
            const dummyViolations: Violation[] = [
                {
                    constraint: "Constraint A",
                    violationCauseGraph: ["Vertex_A", "Vertex_B"],
                },
                {
                    constraint: "Constraint B",
                    violationCauseGraph: ["Vertex_C", "Vertex_D"],
                },
                {
                    constraint: "Constraint C",
                    violationCauseGraph: ["Vertex_E", "Vertex_F"],
                },
            ];

            response.content.violations = dummyViolations;

            this.violationService.updateViolations(response.content.violations);
        }

        return response;
    }
}
