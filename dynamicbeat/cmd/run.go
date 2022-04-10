package cmd

import (
	"github.com/scorestack/scorestack/dynamicbeat/pkg/dynamicbeat"
	"github.com/spf13/cobra"
)

const runShort = `Interact with an instance of Scorestack to run checks and store results.`
const runLong = runShort + `

Dynamicbeat will pull check configurations from the configured Scorestack
instance, execute the checks at regular intervals, and store the results in
Scorestack. This process will be repeated until Dynamicbeat is terminated.`

var rounds uint

// runCmd represents the run command
var runCmd = &cobra.Command{
	Use:   "run",
	Short: runShort,
	Long:  runLong,
	Run: func(cmd *cobra.Command, args []string) {
		cobra.CheckErr(dynamicbeat.Run(rounds))
	},
}

func init() {
	runCmd.Flags().UintVarP(&rounds, "rounds", "R", 0, "run the specified number of rounds and exit")

	rootCmd.AddCommand(runCmd)
}
