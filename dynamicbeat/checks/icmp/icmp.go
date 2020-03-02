package icmp

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/sparrc/go-ping"

	"github.com/s-newman/scorestack/dynamicbeat/checks/schema"
)

// The Definition configures the behavior of the ICMP check
// it implements the "Check" interface
type Definition struct {
	ID          string  // unique identifier for this check
	Name        string  // a human-readable title for this check
	Group       string  // the group this check is part of
	ScoreWeight float64 // the weight that this check has relative to others
	Host        string  // (required) IP or hostname of the host to run the ICMP check against
	Count       int     // (opitonal, default=1) The number of ICMP requests to send per check
}

// Run a single instance of the check
func (d *Definition) Run(ctx context.Context) schema.CheckResult {

	// Set up result
	result := schema.CheckResult{
		Timestamp:   time.Now(),
		ID:          d.ID,
		Name:        d.Name,
		Group:       d.Group,
		ScoreWeight: d.ScoreWeight,
		CheckType:   "icmp",
	}

	// Create pinger
	pinger, err := ping.NewPinger(d.Host)
	if err != nil {
		result.Message = fmt.Sprintf("Error creating pinger: %s", err)
		return result
	}

	// Send ping
	pinger.Count = 3
	pinger.Timeout = 25 * time.Second
	pinger.Run()

	stats := pinger.Statistics()

	if stats.PacketLoss >= 70.0 {
		result.Message = fmt.Sprintf("FAILED: Not all pings made it back! Received %d out of %d", stats.PacketsRecv, stats.PacketsSent)
		return result
	}

	// Check for failure of ICMP
	// if stats.PacketsRecv != d.Count {
	// 	result.Message = fmt.Sprintf("FAILED: Not all pings made it back! Received %d out of %d", stats.PacketsRecv, stats.PacketsSent)
	// 	return result
	// }

	// If we make it here the check passes
	result.Passed = true
	return result

}

// Init the check using a known ID and name. The rest of the check fields will
// be filled in by parsing a JSON string representing the check definition.
func (d *Definition) Init(id string, name string, group string, scoreWeight float64, def []byte) error {

	// Explicitly set default values
	d.Count = 1

	// Unpack json definition
	err := json.Unmarshal(def, &d)
	if err != nil {
		return err
	}

	// Set generic attributes
	d.ID = id
	d.Name = name
	d.Group = group
	d.ScoreWeight = scoreWeight

	// Make sure required fields are defined
	missingFields := make([]string, 0)
	if d.Host == "" {
		missingFields = append(missingFields, "Host")
	}

	// Error only the first missing field, if there are any
	if len(missingFields) > 0 {
		return schema.ValidationError{
			ID:    d.ID,
			Type:  "icmp",
			Field: missingFields[0],
		}
	}
	return nil
}
